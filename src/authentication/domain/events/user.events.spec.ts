import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import {
  UserRegisteredEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserPasswordChangedEvent,
  UserPasswordResetRequestedEvent,
  UserPasswordResetCompletedEvent,
} from './user.events';

describe('Authentication Domain Events', () => {
  const inputCredentials = mockCredentials();

  describe('UserRegisteredEvent', () => {
    it('toJSON returns authId and email', () => {
      const event = new UserRegisteredEvent(inputCredentials);
      expect(event.toJSON()).toEqual({
        authId: inputCredentials.authId,
        email: inputCredentials.email,
      });
    });

    it('has a unique eventId', () => {
      const eventA = new UserRegisteredEvent(inputCredentials);
      const eventB = new UserRegisteredEvent(inputCredentials);
      expect(eventA.eventId).not.toBe(eventB.eventId);
    });

    it('has the correct eventName', () => {
      const event = new UserRegisteredEvent(inputCredentials);
      expect(event.eventName).toBe('authentication.user.registered');
    });
  });

  describe('UserLoggedInEvent', () => {
    it('toJSON returns authId only', () => {
      const event = new UserLoggedInEvent(inputCredentials);
      expect(event.toJSON()).toEqual({ authId: inputCredentials.authId });
    });

    it('has the correct eventName', () => {
      const event = new UserLoggedInEvent(inputCredentials);
      expect(event.eventName).toBe('authentication.user.logged.in');
    });
  });

  describe('UserLoggedOutEvent', () => {
    it('toJSON returns authId only', () => {
      const event = new UserLoggedOutEvent(inputCredentials);
      expect(event.toJSON()).toEqual({ authId: inputCredentials.authId });
    });

    it('has the correct eventName', () => {
      const event = new UserLoggedOutEvent(inputCredentials);
      expect(event.eventName).toBe('authentication.user.logged.out');
    });
  });

  describe('UserPasswordChangedEvent', () => {
    it('toJSON returns authId only', () => {
      const event = new UserPasswordChangedEvent(inputCredentials);
      expect(event.toJSON()).toEqual({ authId: inputCredentials.authId });
    });

    it('has the correct eventName', () => {
      const event = new UserPasswordChangedEvent(inputCredentials);
      expect(event.eventName).toBe('authentication.user.password.changed');
    });
  });

  describe('UserPasswordResetRequestedEvent', () => {
    const inputRawToken = 'raw-reset-token-abc123';

    it('toJSON returns authId and email', () => {
      const event = new UserPasswordResetRequestedEvent(
        inputCredentials,
        inputRawToken,
      );
      expect(event.toJSON()).toEqual({
        authId: inputCredentials.authId,
        email: inputCredentials.email,
      });
    });

    it('exposes rawToken as a public property', () => {
      const event = new UserPasswordResetRequestedEvent(
        inputCredentials,
        inputRawToken,
      );
      expect(event.rawToken).toBe(inputRawToken);
    });

    it('has the correct eventName', () => {
      const event = new UserPasswordResetRequestedEvent(
        inputCredentials,
        inputRawToken,
      );
      expect(event.eventName).toBe(
        'authentication.user.password.reset.requested',
      );
    });
  });

  describe('UserPasswordResetCompletedEvent', () => {
    it('toJSON returns authId only', () => {
      const event = new UserPasswordResetCompletedEvent(inputCredentials);
      expect(event.toJSON()).toEqual({ authId: inputCredentials.authId });
    });

    it('has the correct eventName', () => {
      const event = new UserPasswordResetCompletedEvent(inputCredentials);
      expect(event.eventName).toBe(
        'authentication.user.password.reset.completed',
      );
    });
  });

  describe('BaseEvent properties', () => {
    it('payload getter returns the same value as toJSON', () => {
      const event = new UserRegisteredEvent(inputCredentials);
      expect(event.payload).toEqual(event.toJSON());
    });

    it('metadata contains timestamp and version', () => {
      const event = new UserRegisteredEvent(inputCredentials);
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
    });
  });
});
