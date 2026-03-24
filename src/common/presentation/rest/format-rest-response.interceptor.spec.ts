import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { FormatRestResponseInterceptor } from './format-rest-response.interceptor';
import RestResponse, { MessageType } from './RestResponse';

describe('FormatRestResponseInterceptor', () => {
  let interceptor: FormatRestResponseInterceptor<unknown>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new FormatRestResponseInterceptor();
  });

  it('wraps the returned data in RestResponse.ok', (done) => {
    const data = { id: 1, name: 'test' };
    const callHandler: CallHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext, callHandler).subscribe((result) => {
      expect(result).toBeInstanceOf(RestResponse);
      expect(result.message).toBe(MessageType.SUCCESS);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
      done();
    });
  });

  it('passes undefined data through to RestResponse.ok', (done) => {
    const callHandler: CallHandler = { handle: () => of(undefined) };

    interceptor.intercept(mockContext, callHandler).subscribe((result) => {
      expect(result).toBeInstanceOf(RestResponse);
      expect(result.data).toBeUndefined();
      done();
    });
  });

  it('wraps null data in RestResponse.ok', (done) => {
    const callHandler: CallHandler = { handle: () => of(null) };

    interceptor.intercept(mockContext, callHandler).subscribe((result) => {
      expect(result).toBeInstanceOf(RestResponse);
      expect(result.data).toBeNull();
      done();
    });
  });

  it('preserves array data unchanged', (done) => {
    const data = [1, 2, 3];
    const callHandler: CallHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext, callHandler).subscribe((result) => {
      expect(result.data).toBe(data);
      done();
    });
  });
});
