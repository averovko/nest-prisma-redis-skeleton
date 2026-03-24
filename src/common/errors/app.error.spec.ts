import { HttpStatus } from '@nestjs/common';
import { AppError, ErrorDefinition } from './app.error';

describe('AppError', () => {
  const definition: ErrorDefinition = {
    message: 'Something went wrong',
    status: HttpStatus.BAD_REQUEST,
  };

  it('sets code, status, name, and timestamp', () => {
    const error = new AppError('test.code', definition);

    expect(error.code).toBe('test.code');
    expect(error.status).toBe(HttpStatus.BAD_REQUEST);
    expect(error.name).toBe('AppError');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('sets empty params and undefined cause by default', () => {
    const error = new AppError('test.code', definition);

    expect(error.params).toEqual({});
    expect(error.cause).toBeUndefined();
  });

  it('stores provided params', () => {
    const params = { key: 'value', count: 42 };
    const error = new AppError('test.code', definition, { params });

    expect(error.params).toEqual(params);
  });

  it('stores provided cause', () => {
    const cause = new Error('original error');
    const error = new AppError('test.code', definition, { cause });

    expect(error.cause).toBe(cause);
  });

  it('interpolates {param} placeholders in message', () => {
    const def: ErrorDefinition = {
      message: 'Hello {name}, you have {count} items',
      status: HttpStatus.OK,
    };
    const error = new AppError('msg.code', def, {
      params: { name: 'Alice', count: 5 },
    });

    expect(error.message).toBe('Hello Alice, you have 5 items');
  });

  it('leaves missing placeholders as-is', () => {
    const def: ErrorDefinition = {
      message: 'Hello {name} and {missing}',
      status: HttpStatus.OK,
    };
    const error = new AppError('msg.code', def, { params: { name: 'Alice' } });

    expect(error.message).toBe('Hello Alice and {missing}');
  });

  it('toJSON returns correct shape with ISO timestamp string', () => {
    const params = { role: 'admin' };
    const error = new AppError('test.code', definition, { params });
    const json = error.toJSON();

    expect(json.code).toBe('test.code');
    expect(json.message).toBe('Something went wrong');
    expect(json.params).toEqual(params);
    expect(typeof json.timestamp).toBe('string');
    expect(() => new Date(json.timestamp as string)).not.toThrow();
  });

  it('is an instance of Error', () => {
    const error = new AppError('test.code', definition);

    expect(error).toBeInstanceOf(Error);
  });

  it('has a stack trace', () => {
    const error = new AppError('test.code', definition);

    expect(error.stack).toBeDefined();
  });
});
