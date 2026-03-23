import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
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
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';
import {
  TOKEN_ISSUER_PORT,
  type TokenIssuerPort,
} from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { LoginInput } from '../dto/login.input';
import { TokenPairOutput } from '../dto/token-pair.output';
import { UserLoggedInEvent } from 'src/authentication/domain/events';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: LoginInput): Promise<TokenPairOutput> {
    const credentials = await this.credentialsRepository.findByEmail(
      input.email,
    );
    if (!credentials) {
      throw AuthenticationErrorFactory.invalidCredentials();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      credentials.passwordHash,
    );
    if (!isPasswordValid) {
      throw AuthenticationErrorFactory.invalidCredentials();
    }

    const tokenPair = this.tokenIssuer.issueTokenPair({
      authId: credentials.authId,
      email: credentials.email,
    });
    const tokenHash = createHash('sha256')
      .update(tokenPair.refreshToken)
      .digest('hex');
    const refreshTokenTtlMs = this.configService.get<number>(
      'security.refreshTokenTtlMs',
      30 * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create({
      credentialsId: credentials.id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
    });

    await this.eventBus.publish(new UserLoggedInEvent(credentials));

    return tokenPair;
  }
}
