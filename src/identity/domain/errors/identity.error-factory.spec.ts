import { IdentityErrorFactory } from './identity.error-factory';
import {
  InvalidBulkOperationError,
  RequirePersonError,
  UserCreateError,
  UserDeleteError,
  UserNotFoundError,
  UserProfileNotFoundError,
  UserProfileUpdateError,
  UserQueryError,
  UserUpdateError,
} from './identity.error-classes';

describe('IdentityErrorFactory', () => {
  describe('userNotFound', () => {
    it('returns a UserNotFoundError with the userId', () => {
      const actualError = IdentityErrorFactory.userNotFound('user-123');

      expect(actualError).toBeInstanceOf(UserNotFoundError);
      expect(actualError.message).toContain('user-123');
    });
  });

  describe('userProfileNotFound', () => {
    it('returns a UserProfileNotFoundError with the userId', () => {
      const actualError = IdentityErrorFactory.userProfileNotFound('user-123');

      expect(actualError).toBeInstanceOf(UserProfileNotFoundError);
    });
  });

  describe('invalidBulkOperation', () => {
    it('returns an InvalidBulkOperationError with the operation name', () => {
      const actualError =
        IdentityErrorFactory.invalidBulkOperation('UNKNOWN_OP');

      expect(actualError).toBeInstanceOf(InvalidBulkOperationError);
    });
  });

  describe('userCreateFailed', () => {
    it('returns a UserCreateError', () => {
      const actualError = IdentityErrorFactory.userCreateFailed();

      expect(actualError).toBeInstanceOf(UserCreateError);
    });

    it('includes cause when provided', () => {
      const inputCause = new Error('db error');
      const actualError = IdentityErrorFactory.userCreateFailed(inputCause);

      expect(actualError).toBeInstanceOf(UserCreateError);
    });
  });

  describe('userUpdateFailed', () => {
    it('returns a UserUpdateError', () => {
      const actualError = IdentityErrorFactory.userUpdateFailed('user-123');

      expect(actualError).toBeInstanceOf(UserUpdateError);
    });
  });

  describe('userDeleteFailed', () => {
    it('returns a UserDeleteError', () => {
      const actualError = IdentityErrorFactory.userDeleteFailed('user-123');

      expect(actualError).toBeInstanceOf(UserDeleteError);
    });
  });

  describe('userQueryFailed', () => {
    it('returns a UserQueryError', () => {
      const actualError = IdentityErrorFactory.userQueryFailed();

      expect(actualError).toBeInstanceOf(UserQueryError);
    });
  });

  describe('userProfileUpdateFailed', () => {
    it('returns a UserProfileUpdateError', () => {
      const actualError =
        IdentityErrorFactory.userProfileUpdateFailed('user-123');

      expect(actualError).toBeInstanceOf(UserProfileUpdateError);
    });
  });

  describe('requirePerson', () => {
    it('returns a RequirePersonError', () => {
      const actualError = IdentityErrorFactory.requirePerson();

      expect(actualError).toBeInstanceOf(RequirePersonError);
    });
  });
});
