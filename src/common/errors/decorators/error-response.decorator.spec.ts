import { HttpStatus } from '@nestjs/common';

jest.mock('@nestjs/swagger', () => ({
  ApiResponse: jest.fn().mockReturnValue(jest.fn()),
}));

import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from './error-response.decorator';

const mockApiResponse = ApiResponse as jest.MockedFunction<typeof ApiResponse>;

describe('ErrorResponse decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a decorator function', () => {
    const decorator = ErrorResponse({
      'test.error': {
        message: 'Test error',
        status: HttpStatus.BAD_REQUEST,
      },
    });

    expect(typeof decorator).toBe('function');
  });

  it('calls ApiResponse once for a single status code', () => {
    ErrorResponse({
      'test.error': {
        message: 'Test error',
        status: HttpStatus.BAD_REQUEST,
      },
    });

    expect(mockApiResponse).toHaveBeenCalledTimes(1);
    expect(mockApiResponse).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
    );
  });

  it('calls ApiResponse once per unique status code', () => {
    ErrorResponse({
      'auth.error': {
        message: 'Auth failed',
        status: HttpStatus.UNAUTHORIZED,
      },
      'server.error': {
        message: 'Server error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });

    expect(mockApiResponse).toHaveBeenCalledTimes(2);
  });

  it('groups multiple errors with same status into one ApiResponse call', () => {
    ErrorResponse({
      'auth.invalid-token': {
        message: 'Invalid token',
        status: HttpStatus.UNAUTHORIZED,
      },
      'auth.invalid-api-key': {
        message: 'Invalid API key',
        status: HttpStatus.UNAUTHORIZED,
      },
    });

    expect(mockApiResponse).toHaveBeenCalledTimes(1);

    const callArgs = mockApiResponse.mock.calls[0][0] as {
      content: {
        'application/json': { examples: Record<string, unknown> };
      };
    };

    const examples = callArgs.content['application/json'].examples;
    expect(Object.keys(examples)).toContain('auth.invalid-token');
    expect(Object.keys(examples)).toContain('auth.invalid-api-key');
  });

  it('includes code, message, and timestamp in each example value', () => {
    ErrorResponse({
      'test.code': {
        message: 'Test message',
        status: HttpStatus.BAD_REQUEST,
      },
    });

    const callArgs = mockApiResponse.mock.calls[0][0] as {
      content: {
        'application/json': {
          examples: Record<string, { value: Record<string, unknown> }>;
        };
      };
    };

    const exampleValue = callArgs.content['application/json'].examples['test.code'].value;
    expect(exampleValue.code).toBe('test.code');
    expect(exampleValue.message).toBe('Test message');
    expect(typeof exampleValue.timestamp).toBe('string');
  });

  it('uses provided description in ApiResponse', () => {
    ErrorResponse(
      { 'test.error': { message: 'Error', status: HttpStatus.BAD_REQUEST } },
      { description: 'Custom description' },
    );

    const callArgs = mockApiResponse.mock.calls[0][0] as {
      description: string;
    };
    expect(callArgs.description).toBe('Custom description');
  });
});
