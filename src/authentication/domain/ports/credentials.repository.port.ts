import { Credentials } from '../entities/credentials.entity';

export const CREDENTIALS_REPOSITORY = Symbol('CREDENTIALS_REPOSITORY');

export interface CreateCredentialsInput {
  authId: string;
  email: string;
  passwordHash: string;
}

export interface CredentialsRepositoryPort {
  create(input: CreateCredentialsInput): Promise<Credentials>;
  findById(id: string): Promise<Credentials | null>;
  findByEmail(email: string): Promise<Credentials | null>;
  findByAuthId(authId: string): Promise<Credentials | null>;
  existsByEmail(email: string): Promise<boolean>;
  updatePasswordHash(
    authId: string,
    newPasswordHash: string,
  ): Promise<Credentials>;
}
