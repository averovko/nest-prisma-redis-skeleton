import { AuthDomainError } from './auth-domain-error';

describe('AuthDomainError', () => {
  it('sets code and name correctly', () => {
    const error = new AuthDomainError('require-user');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AuthDomainError');
    expect(error.code).toBe('require-user');
    expect(error.message).toBe('require-user');
  });

  it('stores params when provided', () => {
    const params = { roles: 'ADMIN, ROOT' };
    const error = new AuthDomainError('no-privilege', params);

    expect(error.params).toEqual(params);
  });

  it('has undefined params when not provided', () => {
    const error = new AuthDomainError('require-person');

    expect(error.params).toBeUndefined();
  });

  it.each<AuthDomainError['code']>([
    'require-user',
    'require-person',
    'no-privilege',
  ])('accepts code "%s"', (code) => {
    const error = new AuthDomainError(code);

    expect(error.code).toBe(code);
  });
});
