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
  const inputAuthId = 'auth-id-1';
  const inputEmail = 'test@example.com';

  describe('UserRegisteredEvent', () => {
    const inputFirstName = 'John';
    const inputVerificationToken = 'verification-token-abc123';

    it('toJSON returns authId, email, firstName, and verificationToken', () => {
      const event = new UserRegisteredEvent(inputCredentials, inputFirstName, inputVerificationToken);
      expect(event.toJSON()).toEqual({
        authId: inputCredentials.authId,
        email: inputCredentials.email,
        firstName: inputFirstName,
        verificationToken: inputVerificationToken,
      });
    });

    it('has a unique eventId', () => {
      const eventA = new UserRegisteredEvent(inputCredentials, inputFirstName, inputVerificationToken);
      const eventB = new UserRegisteredEvent(inputCredentials, inputFirstName, inputVerificationToken);
      expect(eventA.eventId).not.toBe(eventB.eventId);
    });

    it('has the correct eventName', () => {
      const event = new UserRegisteredEvent(inputCredentials, inputFirstName, inputVerificationToken);
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
    it('toJSON returns authId and email', () => {
      const event = new UserPasswordChangedEvent(inputAuthId, inputEmail);
      expect(event.toJSON()).toEqual({ authId: inputAuthId, email: inputEmail });
    });

    it('has the correct eventName', () => {
      const event = new UserPasswordChangedEvent(inputAuthId, inputEmail);
      expect(event.eventName).toBe('authentication.user.password.changed');
    });
  });

  describe('UserPasswordResetRequestedEvent', () => {
    const inputRawToken = 'raw-reset-token-abc123';

    it('toJSON returns authId, email, and rawToken', () => {
      const event = new UserPasswordResetRequestedEvent(
        inputCredentials,
        inputRawToken,
      );
      expect(event.toJSON()).toEqual({
        authId: inputCredentials.authId,
        email: inputCredentials.email,
        rawToken: inputRawToken,
      });
    });

    it('includes rawToken in payload', () => {
      const event = new UserPasswordResetRequestedEvent(
        inputCredentials,
        inputRawToken,
      );
      expect(event.payload.rawToken).toBe(inputRawToken);
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
    it('toJSON returns authId and email', () => {
      const event = new UserPasswordResetCompletedEvent(inputCredentials);
      expect(event.toJSON()).toEqual({
        authId: inputCredentials.authId,
        email: inputCredentials.email,
      });
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
      const event = new UserRegisteredEvent(inputCredentials, 'John', 'token-xyz');
      expect(event.payload).toEqual(event.toJSON());
    });

    it('metadata contains timestamp and version', () => {
      const event = new UserRegisteredEvent(inputCredentials, 'John', 'token-xyz');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.metadata.version).toBe('1.0.0');
    });
  });
});
