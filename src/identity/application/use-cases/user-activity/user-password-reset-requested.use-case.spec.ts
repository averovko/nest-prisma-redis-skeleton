import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { type EventBusMessage, type UserPasswordResetRequestedPayload } from 'src/common/event-manager';
import { mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserPasswordResetRequestedUseCase } from './user-password-reset-requested.use-case';

describe('UserPasswordResetRequestedUseCase', () => {
  let sut: UserPasswordResetRequestedUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  const inputMessage: EventBusMessage<UserPasswordResetRequestedPayload> = {
    eventId: 'evt-id-1',
    eventName: 'authentication.user.password.reset.requested',
    payload: {
      authId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      rawToken: 'raw-reset-token-abc123',
    },
    metadata: {
      timestamp: new Date('2024-01-01T00:00:00.000Z').getTime(),
      version: '1.0.0',
    },
  };

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPasswordResetRequestedUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserPasswordResetRequestedUseCase);
  });

  describe('execute', () => {
    it('creates a PASSWORD_RESET_REQUEST activity from the message', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.PASSWORD_RESET_REQUEST }),
      );

      await sut.execute(inputMessage);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.PASSWORD_RESET_REQUEST,
          authId: inputMessage.payload.authId,
          performedBy: inputMessage.payload.authId,
          success: true,
        }),
      );
    });

    it('stores email in details', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.PASSWORD_RESET_REQUEST }),
      );

      await sut.execute(inputMessage);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { email: inputMessage.payload.email },
        }),
      );
    });

    it('uses the event timestamp for the activity', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.PASSWORD_RESET_REQUEST }),
      );

      await sut.execute(inputMessage);

      const createCall = mockActivityRepo.create.mock.calls[0][0];
      expect(createCall.timestamp).toEqual(
        new Date(inputMessage.metadata.timestamp),
      );
    });

    it('extracts request context from event metadata', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.PASSWORD_RESET_REQUEST }),
      );

      const messageWithContext: EventBusMessage<UserPasswordResetRequestedPayload> = {
        ...inputMessage,
        metadata: {
          ...inputMessage.metadata,
          metadata: { ipAddress: '1.2.3.4', userAgent: 'TestAgent', device: 'dev-1' },
        },
      };

      await sut.execute(messageWithContext);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '1.2.3.4',
          userAgent: 'TestAgent',
          device: 'dev-1',
          client: null,
          os: null,
        }),
      );
    });
  });
});
