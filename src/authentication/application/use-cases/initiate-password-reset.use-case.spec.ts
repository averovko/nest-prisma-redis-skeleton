import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/ports/password-reset-token.repository.port';
import { UserPasswordResetRequestedEvent } from '../../domain/events/user.events';
import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import { InitiatePasswordResetUseCase } from './initiate-password-reset.use-case';

describe('InitiatePasswordResetUseCase', () => {
  let useCase: InitiatePasswordResetUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockPasswordResetTokenRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputInitiate = { email: 'test@example.com' };

  beforeEach(async () => {
    mockCredentialsRepo = { findByEmail: jest.fn() };
    mockPasswordResetTokenRepo = {
      deleteAllByCredentialsId: jest.fn(),
      create: jest.fn(),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiatePasswordResetUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        {
          provide: PASSWORD_RESET_TOKEN_REPOSITORY,
          useValue: mockPasswordResetTokenRepo,
        },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(60 * 60 * 1000) },
        },
      ],
    }).compile();

    useCase = module.get(InitiatePasswordResetUseCase);
  });

  describe('execute', () => {
    it('creates a reset token and publishes event when email is registered', async () => {
      const expectedCredentials = mockCredentials();
      mockCredentialsRepo.findByEmail.mockResolvedValue(expectedCredentials);
      mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );
      mockPasswordResetTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputInitiate);

      expect(
        mockPasswordResetTokenRepo.deleteAllByCredentialsId,
      ).toHaveBeenCalledWith(expectedCredentials.id);
      expect(mockPasswordResetTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          credentialsId: expectedCredentials.id,
          expiresAt: expect.any(Date),
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserPasswordResetRequestedEvent),
      );
    });

    it('deletes existing tokens before creating a new one to prevent duplicates', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );
      mockPasswordResetTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputInitiate);

      const deleteCallOrder =
        mockPasswordResetTokenRepo.deleteAllByCredentialsId.mock
          .invocationCallOrder[0];
      const createCallOrder =
        mockPasswordResetTokenRepo.create.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);
    });

    it('stores a SHA-256 hash of the raw token, not the raw token itself', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );
      mockPasswordResetTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputInitiate);

      const createCall = mockPasswordResetTokenRepo.create.mock.calls[0][0];
      expect(createCall.tokenHash).toHaveLength(64);
    });

    it('ensures stored hash matches SHA-256 of rawToken published in event', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );
      mockPasswordResetTokenRepo.create.mockResolvedValue({});

      await useCase.execute(inputInitiate);

      const publishedEvent = mockEventBus.publish.mock
        .calls[0][0] as UserPasswordResetRequestedEvent;
      const createCall = mockPasswordResetTokenRepo.create.mock.calls[0][0];
      const expectedHash = createHash('sha256')
        .update(publishedEvent.payload.rawToken)
        .digest('hex');
      expect(createCall.tokenHash).toBe(expectedHash);
    });

    it('forwards requestContext as event metadata when provided', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials());
      mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(
        undefined,
      );
      mockPasswordResetTokenRepo.create.mockResolvedValue({});
      const requestContext = {
        ipAddress: '9.9.9.9',
        device: 'Desktop',
        client: 'Chrome',
        os: 'Linux',
      };

      await useCase.execute(inputInitiate, requestContext);

      const publishedEvent: UserPasswordResetRequestedEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.metadata.metadata).toEqual(requestContext);
    });

    it('returns silently without any side effects when email is not registered', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.execute({ email: 'unknown@example.com' }),
      ).resolves.toBeUndefined();

      expect(
        mockPasswordResetTokenRepo.deleteAllByCredentialsId,
      ).not.toHaveBeenCalled();
      expect(mockPasswordResetTokenRepo.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
