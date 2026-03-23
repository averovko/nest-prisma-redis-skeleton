import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../../domain/ports/refresh-token.repository.port';
import {
  TOKEN_ISSUER_PORT,
  type TokenIssuerPort,
} from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { TokenPairOutput } from '../dto/token-pair.output';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(rawRefreshToken: string): Promise<TokenPairOutput> {
    const tokenHash = createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');
    const storedToken = await this.refreshTokenRepository.findByHash(tokenHash);
    if (!storedToken) throw AuthenticationErrorFactory.refreshTokenInvalid();

    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.deleteById(storedToken.id);
      throw AuthenticationErrorFactory.refreshTokenExpired();
    }
    const credentials = await this.credentialsRepository.findById(
      storedToken.credentialsId,
    );
    if (!credentials) throw AuthenticationErrorFactory.credentialsNotFound();

    await this.refreshTokenRepository.deleteById(storedToken.id);

    const tokenPair = this.tokenIssuer.issueTokenPair({
      authId: credentials.authId,
      email: credentials.email,
    });
    const newHash = createHash('sha256')
      .update(tokenPair.refreshToken)
      .digest('hex');
    const refreshTokenTtlMs = this.configService.get<number>(
      'security.refreshTokenTtlMs',
      30 * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenRepository.create({
      credentialsId: credentials.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
    });

    return tokenPair;
  }
}
