import { EmailVerificationToken } from '../entities/email-verification-token.entity';

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
);

export interface CreateEmailVerificationTokenInput {
  credentialsId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface EmailVerificationTokenRepositoryPort {
  create(input: CreateEmailVerificationTokenInput): Promise<EmailVerificationToken>;
  findByHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  deleteById(id: string): Promise<void>;
  deleteAllByCredentialsId(credentialsId: string): Promise<void>;
}
