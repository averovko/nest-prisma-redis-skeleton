import { AppError } from './AppError';

describe('AppError (models)', () => {
  it('sets name from constructor argument', () => {
    const error = new AppError('my.error.name');

    expect(error.name).toBe('my.error.name');
  });

  it('sets message equal to name', () => {
    const error = new AppError('my.error.name');

    expect(error.message).toBe('my.error.name');
  });

  it('defaults msgParams to empty object when not provided', () => {
    const error = new AppError('some.error');

    expect(error.msgParams).toEqual({});
  });

  it('stores provided msgParams', () => {
    const params = { count: 5, label: 'test' };
    const error = new AppError('some.error', params);

    expect(error.msgParams).toEqual(params);
  });

  it('is an instance of Error', () => {
    const error = new AppError('some.error');

    expect(error).toBeInstanceOf(Error);
  });

  it('has a stack trace', () => {
    const error = new AppError('some.error');

    expect(error.stack).toBeDefined();
  });
});
