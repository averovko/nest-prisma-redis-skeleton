import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  CREDENTIALS_REPOSITORY,
  type CredentialsRepositoryPort,
} from '../../domain/ports/credentials.repository.port';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type EmailVerificationTokenRepositoryPort,
} from '../../domain/ports/email-verification-token.repository.port';
import { AuthenticationErrorFactory } from '../../domain/errors';
import { type VerifyEmailInput } from '../dto/verify-email.input';
import { type VerifyEmailOutput } from '../dto/verify-email.output';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepositoryPort,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const verificationToken =
      await this.emailVerificationTokenRepository.findByHash(tokenHash);

    if (!verificationToken) {
      return this.success();
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.emailVerificationTokenRepository.deleteById(
        verificationToken.id,
      );
      return this.success();
    }

    const credentials = await this.credentialsRepository.findById(
      verificationToken.credentialsId,
    );
    if (!credentials) {
      throw AuthenticationErrorFactory.credentialsNotFound();
    }

    if (!credentials.isVerified) {
      await this.credentialsRepository.markAsVerified(credentials.authId);
    }

    await this.emailVerificationTokenRepository.deleteAllByCredentialsId(
      credentials.id,
    );

    return this.success();
  }

  private success(): VerifyEmailOutput {
    return { status: 'ok' };
  }
}
