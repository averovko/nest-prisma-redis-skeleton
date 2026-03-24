import { createCommonError } from 'src/common/errors';
import { AppError } from 'src/common/errors/app.error';

import { AuthAppError } from '../../../application';

export function mapAuthAppError(error: AuthAppError): AppError {
  switch (error.code) {
    case 'invalid-token':
      return createCommonError('auth.invalid-token');
    case 'invalid-api-key':
      return createCommonError('auth.invalid-api-key');
    case 'require-user':
      return createCommonError('auth.require-user');
    case 'require-person':
      return createCommonError('auth.require-person');
    case 'no-privilege':
      return createCommonError('auth.no-privilege', error.params);
    case 'server-error':
    default:
      return createCommonError('server.error');
  }
}

export function rethrowAsAppError(error: unknown): never {
  if (error instanceof AuthAppError) throw mapAuthAppError(error);
  throw error;
}
