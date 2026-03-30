import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { UserLoggedOutEvent } from '../../domain/events/user.events';
import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  beforeEach(async () => {
    mockCredentialsRepo = { findByAuthId: jest.fn() };
    mockRefreshTokenRepo = { deleteAllByCredentialsId: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  describe('execute', () => {
    it('deletes all refresh tokens and publishes UserLoggedOutEvent', async () => {
      const expectedCredentials = mockCredentials();
      mockCredentialsRepo.findByAuthId.mockResolvedValue(expectedCredentials);
      mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );

      await useCase.execute('auth-id-1');

      expect(
        mockRefreshTokenRepo.deleteAllByCredentialsId,
      ).toHaveBeenCalledWith(expectedCredentials.id);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserLoggedOutEvent),
      );
    });

    it('looks up credentials by the provided authId', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(mockCredentials());
      mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );

      await useCase.execute('auth-id-1');

      expect(mockCredentialsRepo.findByAuthId).toHaveBeenCalledWith(
        'auth-id-1',
      );
    });

    it('throws CREDENTIALS_NOT_FOUND when authId has no associated credentials', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(null);

      await expect(useCase.execute('unknown-auth-id')).rejects.toMatchObject({
        code: AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
      });
    });

    it('does not delete tokens or publish events when credentials are not found', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(null);

      await expect(useCase.execute('unknown-auth-id')).rejects.toBeInstanceOf(
        AppError,
      );

      expect(
        mockRefreshTokenRepo.deleteAllByCredentialsId,
      ).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
