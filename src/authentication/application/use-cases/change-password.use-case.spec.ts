import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { PASSWORD_HASHER_PORT } from '../../domain/ports/password-hasher.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { UserPasswordChangedEvent } from '../../domain/events/user.events';
import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockPasswordHasher: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputAuthId = 'auth-id-1';
  const inputChangePassword = {
    currentPassword: 'OldPass1!',
    newPassword: 'NewPass2@',
  };

  beforeEach(async () => {
    mockCredentialsRepo = {
      findByAuthId: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    mockPasswordHasher = {
      compare: jest.fn(),
      hash: jest.fn(),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: PASSWORD_HASHER_PORT, useValue: mockPasswordHasher },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
  });

  describe('execute', () => {
    it('updates the password hash and publishes UserPasswordChangedEvent', async () => {
      const expectedUpdated = {
        ...mockCredentials(),
        passwordHash: '$new$hash',
      };
      mockCredentialsRepo.findByAuthId.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockPasswordHasher.hash.mockResolvedValue('$new$hash');
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(expectedUpdated);

      await useCase.execute(inputAuthId, inputChangePassword);

      expect(mockCredentialsRepo.updatePasswordHash).toHaveBeenCalledWith(
        inputAuthId,
        '$new$hash',
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserPasswordChangedEvent),
      );
    });

    it('verifies current password against stored hash before updating', async () => {
      const expectedCredentials = mockCredentials();
      mockCredentialsRepo.findByAuthId.mockResolvedValue(expectedCredentials);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockPasswordHasher.hash.mockResolvedValue('$new$hash');
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(
        expectedCredentials,
      );

      await useCase.execute(inputAuthId, inputChangePassword);

      expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
        inputChangePassword.currentPassword,
        expectedCredentials.passwordHash,
      );
    });

    it('throws CREDENTIALS_NOT_FOUND when authId has no credentials', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(null);

      await expect(
        useCase.execute(inputAuthId, inputChangePassword),
      ).rejects.toMatchObject({
        code: AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
      });
      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws INVALID_CURRENT_PASSWORD when current password does not match', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(
        useCase.execute(inputAuthId, inputChangePassword),
      ).rejects.toMatchObject({
        code: AuthenticationErrorCode.INVALID_CURRENT_PASSWORD,
      });
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockCredentialsRepo.updatePasswordHash).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws AppError for all error cases', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(null);
      await expect(
        useCase.execute(inputAuthId, inputChangePassword),
      ).rejects.toBeInstanceOf(AppError);
    });
  });
});
