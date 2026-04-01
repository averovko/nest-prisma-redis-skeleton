import { Test, TestingModule } from '@nestjs/testing';
import { UserCreatedEvent } from 'src/identity/domain/events/user.events';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import { UserRoleChangedEvent } from 'src/identity/domain/events/user.events';
import { UserActivatedEvent } from 'src/identity/domain/events/user.events';
import { UserDeactivatedEvent } from 'src/identity/domain/events/user.events';
import { UserDeletedEvent } from 'src/identity/domain/events/user.events';
import {
  type EventBusMessage,
  type UserLoggedInPayload,
  type UserLoggedOutPayload,
  type UserPasswordChangedPayload,
  type UserPasswordResetCompletedPayload,
  type UserPasswordResetRequestedPayload,
  type UserRegisteredPayload,
} from 'src/common/event-manager';
import { Role } from 'src/common/auth';
import { mockUser, mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import {
  UserCreatedUseCase,
  UserUpdatedUseCase,
  UserRoleChangedUseCase,
  UserActivatedUseCase,
  UserDeactivatedUseCase,
  UserDeletedUseCase,
  UserPasswordChangedUseCase,
  UserRegisteredUseCase,
  UserLoggedInUseCase,
  UserLoggedOutUseCase,
  UserPasswordResetRequestedUseCase,
  UserPasswordResetCompletedUseCase,
} from '../use-cases/user-activity';
import { UserActivityHandler } from './user-activity.handler';

describe('UserActivityHandler', () => {
  let sut: UserActivityHandler;
  let mockUserCreatedUseCase: jest.Mocked<any>;
  let mockUserUpdatedUseCase: jest.Mocked<any>;
  let mockUserRoleChangedUseCase: jest.Mocked<any>;
  let mockUserActivatedUseCase: jest.Mocked<any>;
  let mockUserDeactivatedUseCase: jest.Mocked<any>;
  let mockUserDeletedUseCase: jest.Mocked<any>;
  let mockUserPasswordChangedUseCase: jest.Mocked<any>;
  let mockUserRegisteredUseCase: jest.Mocked<any>;
  let mockUserLoggedInUseCase: jest.Mocked<any>;
  let mockUserLoggedOutUseCase: jest.Mocked<any>;
  let mockUserPasswordResetRequestedUseCase: jest.Mocked<any>;
  let mockUserPasswordResetCompletedUseCase: jest.Mocked<any>;

  const mockActivity = mockUserActivity();

  beforeEach(async () => {
    mockUserCreatedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserUpdatedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserRoleChangedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserActivatedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserDeactivatedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserDeletedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserPasswordChangedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserRegisteredUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserLoggedInUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserLoggedOutUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserPasswordResetRequestedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };
    mockUserPasswordResetCompletedUseCase = { execute: jest.fn().mockResolvedValue(mockActivity) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityHandler,
        { provide: UserCreatedUseCase, useValue: mockUserCreatedUseCase },
        { provide: UserUpdatedUseCase, useValue: mockUserUpdatedUseCase },
        { provide: UserRoleChangedUseCase, useValue: mockUserRoleChangedUseCase },
        { provide: UserActivatedUseCase, useValue: mockUserActivatedUseCase },
        { provide: UserDeactivatedUseCase, useValue: mockUserDeactivatedUseCase },
        { provide: UserDeletedUseCase, useValue: mockUserDeletedUseCase },
        { provide: UserPasswordChangedUseCase, useValue: mockUserPasswordChangedUseCase },
        { provide: UserRegisteredUseCase, useValue: mockUserRegisteredUseCase },
        { provide: UserLoggedInUseCase, useValue: mockUserLoggedInUseCase },
        { provide: UserLoggedOutUseCase, useValue: mockUserLoggedOutUseCase },
        { provide: UserPasswordResetRequestedUseCase, useValue: mockUserPasswordResetRequestedUseCase },
        { provide: UserPasswordResetCompletedUseCase, useValue: mockUserPasswordResetCompletedUseCase },
      ],
    }).compile();

    sut = module.get(UserActivityHandler);
  });

  describe('handleUserCreated', () => {
    it('delegates to UserCreatedUseCase', () => {
      const inputEvent = new UserCreatedEvent(mockUser());

      sut.handleUserCreated(inputEvent);

      expect(mockUserCreatedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserUpdated', () => {
    it('delegates to UserUpdatedUseCase', () => {
      const inputEvent = new UserUpdatedEvent(mockUser());

      sut.handleUserUpdated(inputEvent);

      expect(mockUserUpdatedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserRoleChanged', () => {
    it('delegates to UserRoleChangedUseCase', () => {
      const inputEvent = new UserRoleChangedEvent(
        'user-1',
        '550e8400-e29b-41d4-a716-446655440001',
        [Role.ADMIN],
        'op-1',
      );

      sut.handleUserRoleChanged(inputEvent);

      expect(mockUserRoleChangedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserActivated', () => {
    it('delegates to UserActivatedUseCase', () => {
      const inputEvent = new UserActivatedEvent(
        'user-1',
        '550e8400-e29b-41d4-a716-446655440001',
        'op-1',
      );

      sut.handleUserActivated(inputEvent);

      expect(mockUserActivatedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserDeactivated', () => {
    it('delegates to UserDeactivatedUseCase', () => {
      const inputEvent = new UserDeactivatedEvent(
        'user-1',
        '550e8400-e29b-41d4-a716-446655440001',
        'op-1',
      );

      sut.handleUserDeactivated(inputEvent);

      expect(mockUserDeactivatedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserDeleted', () => {
    it('delegates to UserDeletedUseCase', () => {
      const inputEvent = new UserDeletedEvent(
        'user-1',
        '550e8400-e29b-41d4-a716-446655440001',
        'op-1',
      );

      sut.handleUserDeleted(inputEvent);

      expect(mockUserDeletedUseCase.execute).toHaveBeenCalledWith(inputEvent);
    });
  });

  describe('handleUserPasswordChanged', () => {
    it('delegates to UserPasswordChangedUseCase', () => {
      const inputMessage: EventBusMessage<UserPasswordChangedPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.password.changed',
        payload: { authId: '550e8400-e29b-41d4-a716-446655440001' },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserPasswordChanged(inputMessage);

      expect(mockUserPasswordChangedUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });

  describe('handleUserRegistered', () => {
    it('delegates to UserRegisteredUseCase', () => {
      const inputMessage: EventBusMessage<UserRegisteredPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.registered',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
          firstName: 'John',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserRegistered(inputMessage);

      expect(mockUserRegisteredUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });

  describe('handleUserLoggedIn', () => {
    it('delegates to UserLoggedInUseCase', () => {
      const inputMessage: EventBusMessage<UserLoggedInPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.logged.in',
        payload: { authId: '550e8400-e29b-41d4-a716-446655440001' },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserLoggedIn(inputMessage);

      expect(mockUserLoggedInUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });

  describe('handleUserLoggedOut', () => {
    it('delegates to UserLoggedOutUseCase', () => {
      const inputMessage: EventBusMessage<UserLoggedOutPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.logged.out',
        payload: { authId: '550e8400-e29b-41d4-a716-446655440001' },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserLoggedOut(inputMessage);

      expect(mockUserLoggedOutUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });

  describe('handleUserPasswordResetRequested', () => {
    it('delegates to UserPasswordResetRequestedUseCase', () => {
      const inputMessage: EventBusMessage<UserPasswordResetRequestedPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.password.reset.requested',
        payload: {
          authId: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserPasswordResetRequested(inputMessage);

      expect(mockUserPasswordResetRequestedUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });

  describe('handleUserPasswordResetCompleted', () => {
    it('delegates to UserPasswordResetCompletedUseCase', () => {
      const inputMessage: EventBusMessage<UserPasswordResetCompletedPayload> = {
        eventId: 'evt-1',
        eventName: 'authentication.user.password.reset.completed',
        payload: { authId: '550e8400-e29b-41d4-a716-446655440001' },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
      };

      sut.handleUserPasswordResetCompleted(inputMessage);

      expect(mockUserPasswordResetCompletedUseCase.execute).toHaveBeenCalledWith(inputMessage);
    });
  });
});
