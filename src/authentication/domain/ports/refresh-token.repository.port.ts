import { RefreshToken } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface CreateRefreshTokenInput {
  credentialsId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRepositoryPort {
  create(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  deleteById(id: string): Promise<void>;
  deleteAllByCredentialsId(credentialsId: string): Promise<void>;
}
