import { AppError } from 'src/common/errors';
import { AuthenticationErrorCode } from './authentication.error-codes';
import { AUTHENTICATION_ERRORS } from './authentication.errors';

export class AuthenticationErrorFactory {
  static emailAlreadyTaken(): AppError {
    return new AppError(
      AuthenticationErrorCode.EMAIL_ALREADY_TAKEN,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.EMAIL_ALREADY_TAKEN],
    );
  }
  static invalidCredentials(): AppError {
    return new AppError(
      AuthenticationErrorCode.INVALID_CREDENTIALS,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.INVALID_CREDENTIALS],
    );
  }
  static credentialsNotFound(): AppError {
    return new AppError(
      AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.CREDENTIALS_NOT_FOUND],
    );
  }
  static refreshTokenInvalid(): AppError {
    return new AppError(
      AuthenticationErrorCode.REFRESH_TOKEN_INVALID,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.REFRESH_TOKEN_INVALID],
    );
  }
  static refreshTokenExpired(): AppError {
    return new AppError(
      AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED],
    );
  }

  static invalidCurrentPassword(): AppError {
    return new AppError(
      AuthenticationErrorCode.INVALID_CURRENT_PASSWORD,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.INVALID_CURRENT_PASSWORD],
    );
  }

  static resetTokenInvalid(): AppError {
    return new AppError(
      AuthenticationErrorCode.RESET_TOKEN_INVALID,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.RESET_TOKEN_INVALID],
    );
  }

  static resetTokenExpired(): AppError {
    return new AppError(
      AuthenticationErrorCode.RESET_TOKEN_EXPIRED,
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.RESET_TOKEN_EXPIRED],
    );
  }
}
