import { createHash } from 'crypto';
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
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepositoryPort,
} from '../../domain/ports/password-reset-token.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../domain/ports/refresh-token.repository.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { UserPasswordResetCompletedEvent } from '../../domain/events/user.events';
import { type ConfirmPasswordResetInput } from '../dto/confirm-password-reset.input';

@Injectable()
export class ConfirmPasswordResetUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    input: ConfirmPasswordResetInput,
    requestContext?: RequestContext,
  ): Promise<void> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const resetToken =
      await this.passwordResetTokenRepository.findByHash(tokenHash);

    if (!resetToken) {
      throw AuthenticationErrorFactory.resetTokenInvalid();
    }

    if (resetToken.expiresAt < new Date()) {
      await this.passwordResetTokenRepository.deleteById(resetToken.id);
      throw AuthenticationErrorFactory.resetTokenExpired();
    }

    const credentials = await this.credentialsRepository.findById(
      resetToken.credentialsId,
    );
    if (!credentials) {
      throw AuthenticationErrorFactory.credentialsNotFound();
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    await this.credentialsRepository.updatePasswordHash(
      credentials.authId,
      newPasswordHash,
    );

    await this.passwordResetTokenRepository.deleteById(resetToken.id);
    await this.refreshTokenRepository.deleteAllByCredentialsId(credentials.id);

    const eventParams = requestContext
      ? { metadata: requestContext }
      : undefined;
    await this.eventBus.publish(
      new UserPasswordResetCompletedEvent(credentials, eventParams),
    );
  }
}
