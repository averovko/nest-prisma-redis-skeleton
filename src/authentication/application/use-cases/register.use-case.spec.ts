import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository.port';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../domain/ports/email-verification-token.repository.port';
import { PASSWORD_HASHER_PORT } from '../../domain/ports/password-hasher.port';
import { TOKEN_ISSUER_PORT } from '../../domain/ports/token-issuer.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { UserRegisteredEvent } from '../../domain/events/user.events';
import {
  mockCredentials,
  mockTokenPair,
} from '../../__fixtures__/auth.fixtures';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockPasswordHasher: jest.Mocked<any>;
  let mockTokenIssuer: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;
  let mockConfigService: jest.Mocked<any>;

  const inputRegister = {
    email: 'john@example.com',
    password: 'StrongPass1!',
    firstName: 'John',
  };

  beforeEach(async () => {
    mockCredentialsRepo = {
      existsByEmail: jest.fn(),
      create: jest.fn(),
    };
    mockRefreshTokenRepo = { create: jest.fn() };
    mockPasswordHasher = { hash: jest.fn() };
    mockTokenIssuer = { issueTokenPair: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    mockConfigService = {
      get: jest.fn().mockReturnValue(30 * 24 * 60 * 60 * 1000),
    };
    const mockEmailVerificationTokenRepo = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        {
          provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
          useValue: mockEmailVerificationTokenRepo,
        },
        { provide: PASSWORD_HASHER_PORT, useValue: mockPasswordHasher },
        { provide: TOKEN_ISSUER_PORT, useValue: mockTokenIssuer },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  describe('execute', () => {
    it('registers user and returns a token pair on happy path', async () => {
      const expectedCredentials = mockCredentials();
      const expectedTokenPair = mockTokenPair();
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(expectedCredentials);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      const actualResult = await useCase.execute(inputRegister);

      expect(actualResult).toEqual(expectedTokenPair);
    });

    it('checks email uniqueness before creating credentials', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      expect(mockCredentialsRepo.existsByEmail).toHaveBeenCalledWith(
        inputRegister.email,
      );
    });

    it('hashes the password before storing credentials', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(
        inputRegister.password,
      );
      expect(mockCredentialsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: inputRegister.email,
          passwordHash: '$2b$12$hashed',
        }),
      );
    });

    it('stores a hashed refresh token (not the raw value)', async () => {
      const expectedCredentials = mockCredentials();
      const expectedTokenPair = mockTokenPair();
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(expectedCredentials);
      mockTokenIssuer.issueTokenPair.mockReturnValue(expectedTokenPair);
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      const createCall = mockRefreshTokenRepo.create.mock.calls[0][0];
      expect(createCall.credentialsId).toBe(expectedCredentials.id);
      expect(createCall.tokenHash).not.toBe(expectedTokenPair.refreshToken);
      expect(createCall.tokenHash).toHaveLength(64);
      expect(createCall.expiresAt).toBeInstanceOf(Date);
    });

    it('publishes UserRegisteredEvent after successful registration', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserRegisteredEvent),
      );
    });

    it('includes firstName in the published UserRegisteredEvent', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      const publishedEvent: UserRegisteredEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.payload.firstName).toBe(inputRegister.firstName);
    });

    it('forwards requestContext as event metadata when provided', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});
      const requestContext = {
        ipAddress: '1.2.3.4',
        userAgent: 'UA',
        device: 'Desktop',
        client: 'Chrome',
        os: 'Linux',
      };

      await useCase.execute(inputRegister, requestContext);

      const publishedEvent: UserRegisteredEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.metadata.metadata).toEqual(requestContext);
    });

    it('publishes event without metadata when requestContext is not provided', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('$2b$12$hashed');
      mockCredentialsRepo.create.mockResolvedValue(mockCredentials());
      mockTokenIssuer.issueTokenPair.mockReturnValue(mockTokenPair());
      mockRefreshTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputRegister);

      const publishedEvent: UserRegisteredEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.metadata.metadata).toBeUndefined();
    });

    it('throws EMAIL_ALREADY_TAKEN when email is already registered', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(true);

      await expect(useCase.execute(inputRegister)).rejects.toMatchObject({
        code: AuthenticationErrorCode.EMAIL_ALREADY_TAKEN,
      });
    });

    it('does not create credentials or publish events when email is already taken', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(true);

      await expect(useCase.execute(inputRegister)).rejects.toBeInstanceOf(
        AppError,
      );

      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockCredentialsRepo.create).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepo.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
