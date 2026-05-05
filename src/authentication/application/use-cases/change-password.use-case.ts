import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS_TOKEN, type EventBusPort } from 'src/common/event-manager';
import { type RequestContext } from 'src/common/auth';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { UserPasswordChangedEvent } from '../../domain/events/user.events';
import { type ChangePasswordInput } from '../dto/change-password.input';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(authId: string, input: ChangePasswordInput, requestContext?: RequestContext): Promise<void> {
    const credentials = await this.credentialsRepository.findByAuthId(authId);
    if (!credentials) {
      throw AuthenticationErrorFactory.credentialsNotFound();
    }

    const isCurrentPasswordValid = await this.passwordHasher.compare(
      input.currentPassword,
      credentials.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw AuthenticationErrorFactory.invalidCurrentPassword();
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    await this.credentialsRepository.updatePasswordHash(
        authId,
        newPasswordHash,
      );
    const eventParams = requestContext ? { metadata: requestContext } : undefined;
    await this.eventBus.publish(new UserPasswordChangedEvent(authId, credentials.email, eventParams));
  }
}
