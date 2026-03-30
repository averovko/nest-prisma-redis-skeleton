import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository.port';
import { PASSWORD_HASHER_PORT } from '../../domain/ports/password-hasher.port';
import { TOKEN_ISSUER_PORT } from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { UserLoggedInEvent } from '../../domain/events/user.events';
import {
  mockCredentials,
  mockTokenPair,
} from '../../__fixtures__/auth.fixtures';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockPasswordHasher: jest.Mocked<any>;
  let mockTokenIssuer: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputLogin = { email: 'test@example.com', password: 'StrongPass1!' };

  beforeEach(async () => {
    mockCredentialsRepo = { findByEmail: jest.fn() };
    mockRefreshTokenRepo = { create: jest.fn() };
    mockPasswordHasher = { compare: jest.fn() };
    mockTokenIssuer = { issueTokenPair: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: PASSWORD_HASHER_PORT, useValue: mockPasswordHasher },
        { provide: TOKEN_ISSUER_PORT, useValue: mockTokenIssuer },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  describe('execute', () => {
    it('returns a token pair on valid credentials', async () => {
      const expectedTokenPair = mockTokenPair();
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      const actualResult = await useCase.execute(inputLogin);

      expect(actualResult).toEqual(expectedTokenPair);
    });

    it('stores a hashed refresh token linked to credentials', async () => {
      const expectedCredentials = mockCredentials();
      const expectedTokenPair = mockTokenPair();
      mockCredentialsRepo.findByEmail.mockResolvedValue(expectedCredentials);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputLogin);

      const createCall = mockRefreshTokenRepo.create.mock.calls[0][0];
      expect(createCall.credentialsId).toBe(expectedCredentials.id);
      expect(createCall.tokenHash).not.toBe(expectedTokenPair.refreshToken);
      expect(createCall.tokenHash).toHaveLength(64);
    });

    it('publishes UserLoggedInEvent on successful login', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputLogin);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserLoggedInEvent),
      );
    });

    it('throws INVALID_CREDENTIALS when user is not found', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(inputLogin)).rejects.toMatchObject({
        code: AuthenticationErrorCode.INVALID_CREDENTIALS,
      });
      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws INVALID_CREDENTIALS when password does not match', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(useCase.execute(inputLogin)).rejects.toMatchObject({
        code: AuthenticationErrorCode.INVALID_CREDENTIALS,
      });
      expect(mockTokenIssuer.issueTokenPair).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws AppError for both authentication failure cases', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(null);
      await expect(useCase.execute(inputLogin)).rejects.toBeInstanceOf(
        AppError,
      );

      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(false);
      await expect(useCase.execute(inputLogin)).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });
});
