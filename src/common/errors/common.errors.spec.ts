import { HttpStatus } from '@nestjs/common';
import {
  COMMON_ERRORS,
  COMMON_PUBLIC_ERRORS,
  createCommonError,
} from './common.errors';
import { AppError } from './app.error';

describe('COMMON_PUBLIC_ERRORS', () => {
  it('defines server.error with INTERNAL_SERVER_ERROR status', () => {
    expect(COMMON_PUBLIC_ERRORS['server.error'].status).toBe(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(typeof COMMON_PUBLIC_ERRORS['server.error'].message).toBe('string');
  });
});

describe('COMMON_ERRORS', () => {
  it.each(Object.keys(COMMON_ERRORS))(
    '"%s" has a string message and numeric status',
    (code) => {
      const def = COMMON_ERRORS[code as keyof typeof COMMON_ERRORS];

      expect(typeof def.message).toBe('string');
      expect(typeof def.status).toBe('number');
    },
  );

  it('includes all required error codes', () => {
    const requiredCodes: Array<keyof typeof COMMON_ERRORS> = [
      'server.error',
      'auth.invalid-token',
      'auth.invalid-api-key',
      'auth.no-privilege',
      'auth.forbidden',
      'auth.require-person',
      'auth.require-user',
    ];

    requiredCodes.forEach((code) => {
      expect(Object.keys(COMMON_ERRORS)).toContain(code);
    });
  });

  it('auth.invalid-token has UNAUTHORIZED status', () => {
    expect(COMMON_ERRORS['auth.invalid-token'].status).toBe(
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('auth.no-privilege has FORBIDDEN status', () => {
    expect(COMMON_ERRORS['auth.no-privilege'].status).toBe(
      HttpStatus.FORBIDDEN,
    );
  });
});

describe('createCommonError', () => {
  it('returns an AppError instance', () => {
    const error = createCommonError('server.error');

    expect(error).toBeInstanceOf(AppError);
  });

  it('sets code and status from the error definition', () => {
    const error = createCommonError('auth.invalid-token');

    expect(error.code).toBe('auth.invalid-token');
    expect(error.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('replaces {roles} placeholder with provided params', () => {
    const error = createCommonError('auth.no-privilege', { roles: 'ADMIN' });

    expect(error.message).toContain('ADMIN');
    expect(error.params).toEqual({ roles: 'ADMIN' });
  });

  it('stores extra params on the error', () => {
    const params = { roles: 'ADMIN, ROOT' };
    const error = createCommonError('auth.no-privilege', params);

    expect(error.params).toEqual(params);
  });

  it('works without params', () => {
    const error = createCommonError('auth.forbidden');

    expect(error).toBeInstanceOf(AppError);
    expect(error.params).toEqual({});
  });
});
