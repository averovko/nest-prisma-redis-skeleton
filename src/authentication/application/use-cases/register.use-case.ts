import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EVENT_BUS_TOKEN, type EventBusPort } from 'src/common/event-manager';
import { type RequestContext } from 'src/common/auth';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../domain/ports/refresh-token.repository.port';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationTokenRepositoryPort,
} from '../../domain/ports/email-verification-token.repository.port';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';
import {
  TOKEN_ISSUER_PORT,
  type TokenIssuerPort,
} from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorFactory } from '../../domain/errors/authentication.error-factory';
import { RegisterInput } from '../dto/register.input';
import { TokenPairOutput } from '../dto/token-pair.output';
import { UserRegisteredEvent } from 'src/authentication/domain/events/user.events';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: RegisterInput,
    requestContext?: RequestContext,
  ): Promise<TokenPairOutput> {
    const emailTaken = await this.credentialsRepository.existsByEmail(
      input.email,
    );
    if (emailTaken) {
      throw AuthenticationErrorFactory.emailAlreadyTaken();
    }

    const authId = randomUUID();
    const passwordHash = await this.passwordHasher.hash(input.password);
    const credentials = await this.credentialsRepository.create({
      authId,
      email: input.email,
      passwordHash,
    });

    const tokenPair = this.tokenIssuer.issueTokenPair({
      authId,
      email: input.email,
    });
    const refreshTokenHash = this.hashToken(tokenPair.refreshToken);
    const refreshTokenTtlMs = this.configService.get<number>(
      'security.refreshTokenTtlMs',
      30 * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create({
      credentialsId: credentials.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
    });

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = this.hashToken(verificationToken);
    const emailVerificationTokenTtlMs = this.configService.get<number>(
      'security.emailVerificationTokenTtlMs',
      24 * 60 * 60 * 1000,
    );

    await this.emailVerificationTokenRepository.create({
      credentialsId: credentials.id,
      tokenHash: verificationTokenHash,
      expiresAt: new Date(Date.now() + emailVerificationTokenTtlMs),
    });

    const eventParams = requestContext
      ? { metadata: requestContext }
      : undefined;
    await this.eventBus.publish(
      new UserRegisteredEvent(
        credentials,
        input.firstName,
        verificationToken,
        eventParams,
      ),
    );

    return tokenPair;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
