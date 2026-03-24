import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppError } from 'src/common/errors';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository.port';
import { TOKEN_ISSUER_PORT } from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import {
  mockCredentials,
  mockRefreshToken,
  mockTokenPair,
} from '../../__fixtures__/auth.fixtures';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockTokenIssuer: jest.Mocked<any>;

  const inputRawToken = 'raw-refresh-token-value-abc123';

  beforeEach(async () => {
    mockCredentialsRepo = { findById: jest.fn() };
    mockRefreshTokenRepo = {
      findByHash: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
    };
    mockTokenIssuer = { issueTokenPair: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: TOKEN_ISSUER_PORT, useValue: mockTokenIssuer },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    }).compile();

    useCase = module.get(RefreshTokenUseCase);
  });

  describe('execute', () => {
    it('returns a new token pair and rotates the refresh token on happy path', async () => {
      const expectedStoredToken = mockRefreshToken();
      const expectedCredentials = mockCredentials();
      const expectedTokenPair = mockTokenPair();
      mockRefreshTokenRepo.findByHash.mockResolvedValue(expectedStoredToken);
      mockCredentialsRepo.findById.mockResolvedValue(expectedCredentials);
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      const actualResult = await useCase.execute(inputRawToken);

      expect(actualResult).toEqual(expectedTokenPair);
    });

    it('looks up the token by SHA-256 hash of the raw token', async () => {
      const expectedHash = createHash('sha256')
        .update(inputRawToken)
        .digest('hex');
      mockRefreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken());
      mockCredentialsRepo.findById.mockResolvedValue(mockCredentials());
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRawToken);

      expect(mockRefreshTokenRepo.findByHash).toHaveBeenCalledWith(
        expectedHash,
      );
    });

    it('deletes old token before issuing new pair (token rotation)', async () => {
      const expectedStoredToken = mockRefreshToken();
      mockRefreshTokenRepo.findByHash.mockResolvedValue(expectedStoredToken);
      mockCredentialsRepo.findById.mockResolvedValue(mockCredentials());
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRawToken);

      const deleteCallOrder =
        mockRefreshTokenRepo.deleteById.mock.invocationCallOrder[0];
      const createCallOrder =
        mockRefreshTokenRepo.create.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);
      expect(mockRefreshTokenRepo.deleteById).toHaveBeenCalledWith(
        expectedStoredToken.id,
      );
    });

    it('stores the new refresh token as a hash, not raw', async () => {
      const expectedTokenPair = mockTokenPair();
      mockRefreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken());
      mockCredentialsRepo.findById.mockResolvedValue(mockCredentials());
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRawToken);

      const createCall = mockRefreshTokenRepo.create.mock.calls[0][0];
      expect(createCall.tokenHash).not.toBe(expectedTokenPair.refreshToken);
      expect(createCall.tokenHash).toHaveLength(64);
    });

    it('throws REFRESH_TOKEN_INVALID when the token hash is not found', async () => {
      mockRefreshTokenRepo.findByHash.mockResolvedValue(null);

      await expect(useCase.execute(inputRawToken)).rejects.toMatchObject({
        code: AuthenticationErrorCode.REFRESH_TOKEN_INVALID,
      });
      expect(mockCredentialsRepo.findById).not.toHaveBeenCalled();
    });

    it('deletes the expired token and throws REFRESH_TOKEN_EXPIRED', async () => {
      const inputExpiredToken = mockRefreshToken({
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      });
      mockRefreshTokenRepo.findByHash.mockResolvedValue(inputExpiredToken);
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);

      await expect(useCase.execute(inputRawToken)).rejects.toMatchObject({
        code: AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED,
      });
      expect(mockRefreshTokenRepo.deleteById).toHaveBeenCalledWith(
        inputExpiredToken.id,
      );
      expect(mockTokenIssuer.issueTokenPair).not.toHaveBeenCalled();
    });

    it('throws CREDENTIALS_NOT_FOUND when credentials have been deleted', async () => {
      mockRefreshTokenRepo.findByHash.mockResolvedValue(mockRefreshToken());
      mockCredentialsRepo.findById.mockResolvedValue(null);
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);

      await expect(useCase.execute(inputRawToken)).rejects.toMatchObject({
        code: AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
      });
      expect(mockTokenIssuer.issueTokenPair).not.toHaveBeenCalled();
    });

    it('throws AppError instances for all error cases', async () => {
      mockRefreshTokenRepo.findByHash.mockResolvedValue(null);
      await expect(useCase.execute(inputRawToken)).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });
});
