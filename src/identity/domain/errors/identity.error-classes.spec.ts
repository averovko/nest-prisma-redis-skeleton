import { HttpStatus } from '@nestjs/common';
import {
  UserNotFoundError,
  UserCreateError,
  UserUpdateError,
  UserDeleteError,
  UserQueryError,
  UserProfileNotFoundError,
  UserProfileUpdateError,
  InvalidBulkOperationError,
  RequirePersonError,
} from './identity.error-classes';
import { IdentityErrorCode } from './identity.error-codes';

describe('Identity Error Classes', () => {
  describe('UserNotFoundError', () => {
    it('has correct code and 404 status', () => {
      const sut = new UserNotFoundError('user-1');

      expect(sut.code).toBe(IdentityErrorCode.USER_NOT_FOUND);
      expect(sut.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('UserCreateError', () => {
    it('has correct code and 500 status', () => {
      const sut = new UserCreateError();

      expect(sut.code).toBe(IdentityErrorCode.USER_CREATE_FAILED);
      expect(sut.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('UserUpdateError', () => {
    it('has correct code and 500 status', () => {
      const sut = new UserUpdateError('user-1');

      expect(sut.code).toBe(IdentityErrorCode.USER_UPDATE_FAILED);
      expect(sut.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('UserDeleteError', () => {
    it('has correct code and 500 status', () => {
      const sut = new UserDeleteError('user-1');

      expect(sut.code).toBe(IdentityErrorCode.USER_DELETE_FAILED);
      expect(sut.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('UserQueryError', () => {
    it('has correct code and 500 status', () => {
      const sut = new UserQueryError();

      expect(sut.code).toBe(IdentityErrorCode.USER_QUERY_FAILED);
      expect(sut.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('UserProfileNotFoundError', () => {
    it('has correct code and 404 status', () => {
      const sut = new UserProfileNotFoundError('user-1');

      expect(sut.code).toBe(IdentityErrorCode.USER_PROFILE_NOT_FOUND);
      expect(sut.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('UserProfileUpdateError', () => {
    it('has correct code and 500 status', () => {
      const sut = new UserProfileUpdateError('user-1');

      expect(sut.code).toBe(IdentityErrorCode.USER_PROFILE_UPDATE_FAILED);
      expect(sut.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('InvalidBulkOperationError', () => {
    it('has correct code and 400 status', () => {
      const sut = new InvalidBulkOperationError('UNKNOWN');

      expect(sut.code).toBe(IdentityErrorCode.INVALID_BULK_OPERATION);
      expect(sut.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('RequirePersonError', () => {
    it('has correct code and 403 status', () => {
      const sut = new RequirePersonError();

      expect(sut.code).toBe(IdentityErrorCode.REQUIRE_PERSON);
      expect(sut.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
