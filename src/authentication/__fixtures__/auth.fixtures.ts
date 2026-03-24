import { Credentials } from '../domain/entities/credentials.entity';
import { RefreshToken } from '../domain/entities/refresh-token.entity';
import { PasswordResetToken } from '../domain/entities/password-reset-token.entity';
import { TokenPairOutput } from '../application/dto/token-pair.output';

export const mockCredentials = (
  overrides?: Partial<Credentials>,
): Credentials => ({
  id: 'cred-id-1',
  authId: 'auth-id-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  isVerified: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockRefreshToken = (
  overrides?: Partial<RefreshToken>,
): RefreshToken => ({
  id: 'rt-id-1',
  credentialsId: 'cred-id-1',
  tokenHash: 'sha256hash',
  expiresAt: new Date(Date.now() + 86_400_000),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockPasswordResetToken = (
  overrides?: Partial<PasswordResetToken>,
): PasswordResetToken => ({
  id: 'prt-id-1',
  credentialsId: 'cred-id-1',
  tokenHash: 'resethash',
  expiresAt: new Date(Date.now() + 3_600_000),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockTokenPair = (): TokenPairOutput => ({
  accessToken: 'access.jwt.token',
  refreshToken: 'refresh.jwt.token',
});
