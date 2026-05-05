import { Test, TestingModule } from '@nestjs/testing';
import {
  type EventBusMessage,
  type UserRegisteredPayload,
  type UserPasswordResetRequestedPayload,
  type UserPasswordChangedPayload,
  type UserPasswordResetCompletedPayload,
} from 'src/common/event-manager';
import { NotificationEventHandler } from './notification-event.handler';
import { SendWelcomeEmailUseCase } from '../use-cases/send-welcome-email.use-case';
import { SendPasswordResetEmailUseCase } from '../use-cases/send-password-reset-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../use-cases/send-password-changed-email.use-case';
import { SendPasswordResetCompletedEmailUseCase } from '../use-cases/send-password-reset-completed-email.use-case';

describe('NotificationEventHandler', () => {
  let sut: NotificationEventHandler;
  let mockSendWelcomeEmail: jest.Mocked<any>;
  let mockSendPasswordResetEmail: jest.Mocked<any>;
  let mockSendPasswordChangedEmail: jest.Mocked<any>;
  let mockSendPasswordResetCompletedEmail: jest.Mocked<any>;

  beforeEach(async () => {
    mockSendWelcomeEmail = { execute: jest.fn().mockResolvedValue(undefined) };
    mockSendPasswordResetEmail = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    mockSendPasswordChangedEmail = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    mockSendPasswordResetCompletedEmail = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventHandler,
        { provide: SendWelcomeEmailUseCase, useValue: mockSendWelcomeEmail },
        {
          provide: SendPasswordResetEmailUseCase,
          useValue: mockSendPasswordResetEmail,
        },
        {
          provide: SendPasswordChangedEmailUseCase,
          useValue: mockSendPasswordChangedEmail,
        },
        {
          provide: SendPasswordResetCompletedEmailUseCase,
          useValue: mockSendPasswordResetCompletedEmail,
        },
      ],
    }).compile();

    sut = module.get(NotificationEventHandler);
  });

  describe('handleUserRegistered', () => {
    it('delegates to SendWelcomeEmailUseCase with mapped payload', async () => {
      const message: EventBusMessage<UserRegisteredPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.registered',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'john@example.com',
          firstName: 'John',
          verificationToken: 'token-abc',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      await sut.handleUserRegistered(message);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledWith({
        email: message.payload.email,
        firstName: message.payload.firstName,
        verificationToken: message.payload.verificationToken,
      });
    });
  });

  describe('handlePasswordResetRequested', () => {
    it('delegates to SendPasswordResetEmailUseCase with mapped payload', async () => {
      const message: EventBusMessage<UserPasswordResetRequestedPayload> = {
        eventId: 'evt-2',
        eventName: 'authentication.user.password.reset.requested',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'user@example.com',
          rawToken: 'reset-token-xyz',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      await sut.handlePasswordResetRequested(message);

      expect(mockSendPasswordResetEmail.execute).toHaveBeenCalledWith({
        email: message.payload.email,
        rawToken: message.payload.rawToken,
      });
    });
  });

  describe('handlePasswordChanged', () => {
    it('delegates to SendPasswordChangedEmailUseCase with mapped payload', async () => {
      const message: EventBusMessage<UserPasswordChangedPayload> = {
        eventId: 'evt-3',
        eventName: 'authentication.user.password.changed',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'user@example.com',
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          metadata: { ipAddress: '9.9.9.9' },
        },
      };

      await sut.handlePasswordChanged(message);

      expect(mockSendPasswordChangedEmail.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: message.payload.email,
          ipAddress: '9.9.9.9',
        }),
      );
    });

    it('passes undefined ipAddress when metadata is absent', async () => {
      const message: EventBusMessage<UserPasswordChangedPayload> = {
        eventId: 'evt-3',
        eventName: 'authentication.user.password.changed',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'user@example.com',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      await sut.handlePasswordChanged(message);

      expect(mockSendPasswordChangedEmail.execute).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: undefined }),
      );
    });
  });

  describe('handlePasswordResetCompleted', () => {
    it('delegates to SendPasswordResetCompletedEmailUseCase with mapped payload', async () => {
      const message: EventBusMessage<UserPasswordResetCompletedPayload> = {
        eventId: 'evt-4',
        eventName: 'authentication.user.password.reset.completed',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'user@example.com',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      await sut.handlePasswordResetCompleted(message);

      expect(mockSendPasswordResetCompletedEmail.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: message.payload.email }),
      );
    });
  });
});
