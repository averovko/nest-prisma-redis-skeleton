import { PasswordResetToken } from '../entities/password-reset-token.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

export interface CreatePasswordResetTokenInput {
  credentialsId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetTokenRepositoryPort {
  create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  deleteById(id: string): Promise<void>;
  deleteAllByCredentialsId(credentialsId: string): Promise<void>;
}
