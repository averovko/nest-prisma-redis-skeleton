import { createHash, randomBytes } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EVENT_BUS_TOKEN, type EventBusPort } from 'src/common/event-manager';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepositoryPort,
} from '../../domain/ports/password-reset-token.repository.port';
import { UserPasswordResetRequestedEvent } from '../../domain/events/user.events';
import { type InitiatePasswordResetInput } from '../dto/initiate-password-reset.input';

@Injectable()
export class InitiatePasswordResetUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepositoryPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: InitiatePasswordResetInput): Promise<void> {
    const credentials = await this.credentialsRepository.findByEmail(
      input.email,
    );
    if (!credentials) {
      return;
    }

    await this.passwordResetTokenRepository.deleteAllByCredentialsId(
      credentials.id,
    );

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const passwordResetTokenTtlMs = this.configService.get<number>(
      'security.passwordResetTokenTtlMs',
      60 * 60 * 1000,
    );

    await this.passwordResetTokenRepository.create({
      credentialsId: credentials.id,
      tokenHash,
      expiresAt: new Date(Date.now() + passwordResetTokenTtlMs),
    });

    await this.eventBus.publish(
      new UserPasswordResetRequestedEvent(credentials, rawToken),
    );
  }
}
