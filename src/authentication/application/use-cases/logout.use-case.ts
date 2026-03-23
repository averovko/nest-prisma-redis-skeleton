import { Inject, Injectable } from '@nestjs/common';
import { type IEventBus } from 'src/common/event-manager';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../domain/ports/refresh-token.repository.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { UserLoggedOutEvent } from 'src/authentication/domain/events/user.events';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(authId: string): Promise<void> {
    const credentials = await this.credentialsRepository.findByAuthId(authId);
    if (!credentials) {
      throw AuthenticationErrorFactory.credentialsNotFound();
    }
    await this.refreshTokenRepository.deleteAllByCredentialsId(credentials.id);
    await this.eventBus.publish(new UserLoggedOutEvent(credentials));
  }
}
