import { AppError } from 'src/common/errors/app.error';
import { AuthAppError } from '../../../application';
import { mapAuthAppError, rethrowAsAppError } from './auth-error.mapper';

describe('auth-error.mapper', () => {
  describe('mapAuthAppError', () => {
    it('maps invalid-token to AppError with auth.invalid-token code', () => {
      const actual = mapAuthAppError(new AuthAppError('invalid-token'));

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('auth.invalid-token');
    });

    it('maps invalid-api-key to AppError with auth.invalid-api-key code', () => {
      const actual = mapAuthAppError(new AuthAppError('invalid-api-key'));

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('auth.invalid-api-key');
    });

    it('maps require-user to AppError with auth.require-user code', () => {
      const actual = mapAuthAppError(new AuthAppError('require-user'));

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('auth.require-user');
    });

    it('maps require-person to AppError with auth.require-person code', () => {
      const actual = mapAuthAppError(new AuthAppError('require-person'));

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('auth.require-person');
    });

    it('maps no-privilege with params to AppError', () => {
      const inputParams = { roles: 'ADMIN, ROOT' };
      const actual = mapAuthAppError(
        new AuthAppError('no-privilege', inputParams),
      );

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('auth.no-privilege');
      expect(actual.params).toEqual(inputParams);
    });

    it('maps server-error to AppError with server.error code', () => {
      const actual = mapAuthAppError(new AuthAppError('server-error'));

      expect(actual).toBeInstanceOf(AppError);
      expect(actual.code).toBe('server.error');
    });
  });

  describe('rethrowAsAppError', () => {
    it('maps and rethrows AuthAppError as AppError', () => {
      const inputError = new AuthAppError('invalid-token');

      expect(() => rethrowAsAppError(inputError)).toThrow(AppError);
      expect(() => rethrowAsAppError(inputError)).toThrow(
        expect.objectContaining({ code: 'auth.invalid-token' }),
      );
    });

    it('rethrows unknown errors as-is', () => {
      const inputError = new Error('unknown');

      expect(() => rethrowAsAppError(inputError)).toThrow(inputError);
    });
  });
});
