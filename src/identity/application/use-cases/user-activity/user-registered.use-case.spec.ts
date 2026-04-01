import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { type EventBusMessage, type UserRegisteredPayload } from 'src/common/event-manager';
import { mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserRegisteredUseCase } from './user-registered.use-case';

describe('UserRegisteredUseCase', () => {
  let sut: UserRegisteredUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  const inputMessage: EventBusMessage<UserRegisteredPayload> = {
    eventId: 'evt-id-1',
    eventName: 'authentication.user.registered',
    payload: {
      authId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      firstName: 'John',
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
        UserRegisteredUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserRegisteredUseCase);
  });

  describe('execute', () => {
    it('creates a REGISTRATION activity from the message', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.REGISTRATION }),
      );

      await sut.execute(inputMessage);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.REGISTRATION,
          authId: inputMessage.payload.authId,
          performedBy: inputMessage.payload.authId,
          success: true,
        }),
      );
    });

    it('stores email and firstName in details', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.REGISTRATION }),
      );

      await sut.execute(inputMessage);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {
            email: inputMessage.payload.email,
            firstName: inputMessage.payload.firstName,
          },
        }),
      );
    });

    it('uses the event timestamp for the activity', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.REGISTRATION }),
      );

      await sut.execute(inputMessage);

      const createCall = mockActivityRepo.create.mock.calls[0][0];
      expect(createCall.timestamp).toEqual(
        new Date(inputMessage.metadata.timestamp),
      );
    });

    it('extracts request context from event metadata', async () => {
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.REGISTRATION }),
      );

      const messageWithContext: EventBusMessage<UserRegisteredPayload> = {
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
