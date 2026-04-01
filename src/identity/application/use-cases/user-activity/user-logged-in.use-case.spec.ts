import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { type EventBusMessage, type UserLoggedInPayload } from 'src/common/event-manager';
import { mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserLoggedInUseCase } from './user-logged-in.use-case';

describe('UserLoggedInUseCase', () => {
  let sut: UserLoggedInUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  const inputMessage: EventBusMessage<UserLoggedInPayload> = {
    eventId: 'evt-id-1',
    eventName: 'authentication.user.logged.in',
    payload: { authId: '550e8400-e29b-41d4-a716-446655440001' },
    metadata: {
      timestamp: new Date('2024-01-01T00:00:00.000Z').getTime(),
      version: '1.0.0',
    },
  };

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLoggedInUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserLoggedInUseCase);
  });

  describe('execute', () => {
    it('creates a LOGIN activity from the message', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.LOGIN }),
      );

      await sut.execute(inputMessage);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.LOGIN,
          authId: inputMessage.payload.authId,
          performedBy: inputMessage.payload.authId,
          success: true,
        }),
      );
    });

    it('uses the event timestamp for the activity', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.LOGIN }),
      );

      await sut.execute(inputMessage);

      const createCall = mockActivityRepo.create.mock.calls[0][0];
      expect(createCall.timestamp).toEqual(
        new Date(inputMessage.metadata.timestamp),
      );
    });

    it('extracts request context from event metadata', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.LOGIN }),
      );

      const messageWithContext: EventBusMessage<UserLoggedInPayload> = {
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
