import { AuthAppError } from './auth-app-error';

describe('AuthAppError', () => {
  it('sets code, name, and message correctly', () => {
    const error = new AuthAppError('invalid-token');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AuthAppError');
    expect(error.code).toBe('invalid-token');
    expect(error.message).toBe('invalid-token');
  });

  it('stores params when provided', () => {
    const params = { roles: 'ADMIN' };
    const error = new AuthAppError('no-privilege', params);

    expect(error.params).toEqual(params);
  });

  it('has undefined params when not provided', () => {
    const error = new AuthAppError('require-user');

    expect(error.params).toBeUndefined();
  });

  it('stores cause when options.cause is an Error', () => {
    const cause = new Error('root cause');
    const error = new AuthAppError('server-error', undefined, { cause });

    expect(error.cause).toBe(cause);
  });

  it('does not set cause when options.cause is not an Error', () => {
    const error = new AuthAppError('server-error', undefined, {
      cause: 'string cause' as unknown as Error,
    });

    expect(error.cause).toBeUndefined();
  });

  it.each<AuthAppError['code']>([
    'invalid-token',
    'invalid-api-key',
    'require-user',
    'require-person',
    'no-privilege',
    'server-error',
  ])('accepts code "%s"', (code) => {
    const error = new AuthAppError(code);

    expect(error.code).toBe(code);
  });
});
