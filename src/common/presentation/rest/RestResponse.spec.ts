import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import RestResponse, { MessageType } from './RestResponse';

describe('RestResponse', () => {
  describe('constructor', () => {
    it('sets message, error, and data', () => {
      const error = { name: 'err', message: 'oops' };
      const response = new RestResponse('my-message', error, { id: 1 });

      expect(response.message).toBe('my-message');
      expect(response.error).toBe(error);
      expect(response.data).toEqual({ id: 1 });
    });

    it('allows omitting error and data', () => {
      const response = new RestResponse('ok');

      expect(response.error).toBeUndefined();
      expect(response.data).toBeUndefined();
    });
  });

  describe('ok()', () => {
    it('uses MessageType.SUCCESS as default message', () => {
      const response = RestResponse.ok();

      expect(response.message).toBe(MessageType.SUCCESS);
    });

    it('wraps data in response', () => {
      const data = { id: 42 };
      const response = RestResponse.ok(data);

      expect(response.data).toEqual(data);
      expect(response.error).toBeUndefined();
    });

    it('uses custom message when provided', () => {
      const response = RestResponse.ok(undefined, 'custom.message');

      expect(response.message).toBe('custom.message');
    });
  });

  describe('error()', () => {
    const errorMap = {
      'auth.invalid': {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      },
      'validation.failed': {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation error for {{field}}',
      },
    };

    it('returns HttpException with correct status for known error', () => {
      const exception = RestResponse.error('auth.invalid', errorMap);

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('sets error name and message in response body', () => {
      const exception = RestResponse.error('auth.invalid', errorMap);
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.name).toBe('auth.invalid');
      expect(body.error?.message).toBe('Invalid credentials');
    });

    it('sets message in response body to the error key', () => {
      const exception = RestResponse.error('auth.invalid', errorMap);
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.message).toBe('auth.invalid');
    });

    it('returns 500 HttpException for unknown error key', () => {
      const exception = RestResponse.error('unknown.key', errorMap);

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('replaces {{param}} placeholders using msgParams', () => {
      const exception = RestResponse.error('validation.failed', errorMap, {
        msgParams: { field: 'email' },
      });
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.message).toBe('Validation error for email');
    });

    it('leaves placeholder intact when param not in msgParams', () => {
      const exception = RestResponse.error('validation.failed', errorMap, {
        msgParams: {},
      });
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.message).toBe('Validation error for {{field}}');
    });

    it('handles msgParams provided when message has no placeholders', () => {
      const exception = RestResponse.error('auth.invalid', errorMap, {
        msgParams: { extra: 'value' },
      });
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.message).toBe('Invalid credentials');
    });
  });

  describe('transformValidatorError()', () => {
    it('returns HttpException with BAD_REQUEST status', () => {
      const validationError = Object.assign(new ValidationError(), {
        property: 'email',
        constraints: { isEmail: 'email must be a valid email' },
      });
      const exception = RestResponse.transformValidatorError([validationError]);

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('uses first error and first constraint for the message', () => {
      const validationError = Object.assign(new ValidationError(), {
        property: 'username',
        constraints: { isNotEmpty: 'username should not be empty' },
      });
      const exception = RestResponse.transformValidatorError([validationError]);
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.message).toBe('username should not be empty');
      expect(body.error?.name).toBe('username.isNotEmpty');
    });

    it('sets message to validation.<property>.<constraint>', () => {
      const validationError = Object.assign(new ValidationError(), {
        property: 'email',
        constraints: { isEmail: 'must be email' },
      });
      const exception = RestResponse.transformValidatorError([validationError]);
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.message).toBe('validation.email.isEmail');
    });

    it('falls back to empty string when constraint message is undefined', () => {
      const validationError = Object.assign(new ValidationError(), {
        property: 'field',
        constraints: { customRule: undefined },
      });
      const exception = RestResponse.transformValidatorError([validationError]);
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.error?.message).toBe('');
    });
  });

  describe('customError()', () => {
    it('returns HttpException with provided http code', () => {
      const exception = RestResponse.customError(
        MessageType.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        { name: 'forbidden', message: 'Access denied' },
      );

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('sets message and error in response body', () => {
      const exception = RestResponse.customError(
        MessageType.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        { name: 'not_found', message: 'Resource not found' },
      );
      const body = exception.getResponse() as RestResponse<unknown>;

      expect(body.message).toBe(MessageType.NOT_FOUND);
      expect(body.error?.name).toBe('not_found');
    });
  });

  describe('MessageType enum', () => {
    it('defines expected values', () => {
      expect(MessageType.SUCCESS).toBe('success');
      expect(MessageType.VALIDATION_FAILED).toBe('validation_failed');
      expect(MessageType.UNAUTHORIZED).toBe('authentication_failed');
      expect(MessageType.FORBIDDEN).toBe('forbidden');
      expect(MessageType.NOT_FOUND).toBe('not_found');
      expect(MessageType.INTERNAL_SERVER_ERROR).toBe('internal_server_error');
    });
  });
});
