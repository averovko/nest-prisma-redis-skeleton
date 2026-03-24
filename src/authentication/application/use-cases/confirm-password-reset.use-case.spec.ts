import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { PASSWORD_HASHER_PORT } from '../../domain/ports/password-hasher.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/ports/password-reset-token.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { UserPasswordResetCompletedEvent } from '../../domain/events/user.events';
import {
  mockCredentials,
  mockPasswordResetToken,
} from '../../__fixtures__/auth.fixtures';
import { ConfirmPasswordResetUseCase } from './confirm-password-reset.use-case';

describe('ConfirmPasswordResetUseCase', () => {
  let useCase: ConfirmPasswordResetUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockPasswordHasher: jest.Mocked<any>;
  let mockPasswordResetTokenRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputConfirm = {
    token: 'raw-reset-token-value',
    newPassword: 'NewStrongPass99!',
  };

  beforeEach(async () => {
    mockCredentialsRepo = {
      findById: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    mockPasswordHasher = { hash: jest.fn() };
    mockPasswordResetTokenRepo = {
      findByHash: jest.fn(),
      deleteById: jest.fn(),
    };
    mockRefreshTokenRepo = { deleteAllByCredentialsId: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmPasswordResetUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: PASSWORD_HASHER_PORT, useValue: mockPasswordHasher },
        {
          provide: PASSWORD_RESET_TOKEN_REPOSITORY,
          useValue: mockPasswordResetTokenRepo,
        },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    useCase = module.get(ConfirmPasswordResetUseCase);
  });

  describe('execute', () => {
    it('resets password, invalidates sessions, and publishes event on happy path', async () => {
      const expectedResetToken = mockPasswordResetToken();
      const expectedCredentials = mockCredentials();
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        expectedResetToken,
      );
      mockCredentialsRepo.findById.mockResolvedValue(expectedCredentials);
      mockPasswordHasher.hash.mockResolvedValue('$new$hash');
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(
        expectedCredentials,
      );
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);
      mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );

      await useCase.execute(inputConfirm);

      expect(mockCredentialsRepo.updatePasswordHash).toHaveBeenCalledWith(
        expectedCredentials.authId,
        '$new$hash',
      );
      expect(mockPasswordResetTokenRepo.deleteById).toHaveBeenCalledWith(
        expectedResetToken.id,
      );
      expect(
        mockRefreshTokenRepo.deleteAllByCredentialsId,
      ).toHaveBeenCalledWith(expectedCredentials.id);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserPasswordResetCompletedEvent),
      );
    });

    it('looks up the token by SHA-256 hash of the raw input token', async () => {
      const expectedHash = createHash('sha256')
        .update(inputConfirm.token)
        .digest('hex');
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        mockPasswordResetToken(),
      );
      mockCredentialsRepo.findById.mockResolvedValue(mockCredentials());
      mockPasswordHasher.hash.mockResolvedValue('$new$hash');
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(
        mockCredentials(),
      );
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);
      mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );

      await useCase.execute(inputConfirm);

      expect(mockPasswordResetTokenRepo.findByHash).toHaveBeenCalledWith(
        expectedHash,
      );
    });

    it('invalidates all refresh tokens after password reset', async () => {
      const expectedCredentials = mockCredentials();
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        mockPasswordResetToken(),
      );
      mockCredentialsRepo.findById.mockResolvedValue(expectedCredentials);
      mockPasswordHasher.hash.mockResolvedValue('$new$hash');
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(
        expectedCredentials,
      );
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);
      mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );

      await useCase.execute(inputConfirm);

      expect(
        mockRefreshTokenRepo.deleteAllByCredentialsId,
      ).toHaveBeenCalledWith(expectedCredentials.id);
    });

    it('throws RESET_TOKEN_INVALID when token hash is not found', async () => {
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(null);

      await expect(useCase.execute(inputConfirm)).rejects.toMatchObject({
        code: AuthenticationErrorCode.RESET_TOKEN_INVALID,
      });
      expect(mockCredentialsRepo.findById).not.toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('deletes the expired token and throws RESET_TOKEN_EXPIRED', async () => {
      const inputExpiredToken = mockPasswordResetToken({
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      });
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        inputExpiredToken,
      );
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);

      await expect(useCase.execute(inputConfirm)).rejects.toMatchObject({
        code: AuthenticationErrorCode.RESET_TOKEN_EXPIRED,
      });
      expect(mockPasswordResetTokenRepo.deleteById).toHaveBeenCalledWith(
        inputExpiredToken.id,
      );
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('throws CREDENTIALS_NOT_FOUND when credentials have been deleted', async () => {
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        mockPasswordResetToken(),
      );
      mockCredentialsRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(inputConfirm)).rejects.toMatchObject({
        code: AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
      });
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws AppError for all error cases', async () => {
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(null);
      await expect(useCase.execute(inputConfirm)).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });
});
