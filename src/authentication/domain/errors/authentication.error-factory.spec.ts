import { HttpStatus } from '@nestjs/common';
import { AppError } from 'src/common/errors';
import { AuthenticationErrorCode } from './authentication.error-codes';
import { AuthenticationErrorFactory } from './authentication.error-factory';

describe('AuthenticationErrorFactory', () => {
  const expectAppError = (
    actualError: AppError,
    expectedCode: AuthenticationErrorCode,
    expectedStatus: HttpStatus,
  ): void => {
    expect(actualError).toBeInstanceOf(AppError);
    expect(actualError.code).toBe(expectedCode);
    expect(actualError.status).toBe(expectedStatus);
    expect(actualError.message).toBeTruthy();
  };

  it('emailAlreadyTaken creates CONFLICT error', () => {
    const actualError = AuthenticationErrorFactory.emailAlreadyTaken();
    expectAppError(actualError, AuthenticationErrorCode.EMAIL_ALREADY_TAKEN, HttpStatus.CONFLICT);
  });

  it('invalidCredentials creates UNAUTHORIZED error', () => {
    const actualError = AuthenticationErrorFactory.invalidCredentials();
    expectAppError(actualError, AuthenticationErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
  });

  it('credentialsNotFound creates NOT_FOUND error', () => {
    const actualError = AuthenticationErrorFactory.credentialsNotFound();
    expectAppError(actualError, AuthenticationErrorCode.CREDENTIALS_NOT_FOUND, HttpStatus.NOT_FOUND);
  });

  it('refreshTokenInvalid creates UNAUTHORIZED error', () => {
    const actualError = AuthenticationErrorFactory.refreshTokenInvalid();
    expectAppError(actualError, AuthenticationErrorCode.REFRESH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
  });

  it('refreshTokenExpired creates UNAUTHORIZED error', () => {
    const actualError = AuthenticationErrorFactory.refreshTokenExpired();
    expectAppError(actualError, AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
  });

  it('invalidCurrentPassword creates UNPROCESSABLE_ENTITY error', () => {
    const actualError = AuthenticationErrorFactory.invalidCurrentPassword();
    expectAppError(actualError, AuthenticationErrorCode.INVALID_CURRENT_PASSWORD, HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('resetTokenInvalid creates NOT_FOUND error', () => {
    const actualError = AuthenticationErrorFactory.resetTokenInvalid();
    expectAppError(actualError, AuthenticationErrorCode.RESET_TOKEN_INVALID, HttpStatus.NOT_FOUND);
  });

  it('resetTokenExpired creates GONE error', () => {
    const actualError = AuthenticationErrorFactory.resetTokenExpired();
    expectAppError(actualError, AuthenticationErrorCode.RESET_TOKEN_EXPIRED, HttpStatus.GONE);
  });

  it('each factory method returns a distinct AppError instance', () => {
    const actualFirst = AuthenticationErrorFactory.emailAlreadyTaken();
    const actualSecond = AuthenticationErrorFactory.emailAlreadyTaken();
    expect(actualFirst).not.toBe(actualSecond);
  });
});
