import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors';
import { AuthenticationErrorCode } from './authentication.error-codes';

export const AUTHENTICATION_ERRORS: Record<
  AuthenticationErrorCode,
  ErrorDefinition
> = {
  [AuthenticationErrorCode.EMAIL_ALREADY_TAKEN]: {
    message: 'An account with this email already exists',
    status: HttpStatus.CONFLICT,
  },
  [AuthenticationErrorCode.INVALID_CREDENTIALS]: {
    message: 'Email or password is incorrect',
    status: HttpStatus.UNAUTHORIZED,
  },
  [AuthenticationErrorCode.CREDENTIALS_NOT_FOUND]: {
    message: 'Account not found',
    status: HttpStatus.NOT_FOUND,
  },
  [AuthenticationErrorCode.REFRESH_TOKEN_INVALID]: {
    message: 'Refresh token is invalid',
    status: HttpStatus.UNAUTHORIZED,
  },
  [AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED]: {
    message: 'Refresh token has expired',
    status: HttpStatus.UNAUTHORIZED,
  },
  [AuthenticationErrorCode.INVALID_CURRENT_PASSWORD]: {
    message: 'Current password is incorrect',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
  },
  [AuthenticationErrorCode.RESET_TOKEN_INVALID]: {
    message: 'Password reset token is invalid',
    status: HttpStatus.NOT_FOUND,
  },
  [AuthenticationErrorCode.RESET_TOKEN_EXPIRED]: {
    message: 'Password reset token has expired',
    status: HttpStatus.GONE,
  },
};
