import { ValidationError } from 'class-validator';
import { EventValidationError } from './event.errors';

describe('EventValidationError', () => {
  it('is an instance of Error', () => {
    const error = new EventValidationError('test message', []);

    expect(error).toBeInstanceOf(Error);
  });

  it('sets name to EventValidationError', () => {
    const error = new EventValidationError('test message', []);

    expect(error.name).toBe('EventValidationError');
  });

  it('sets message from constructor argument', () => {
    const error = new EventValidationError('validation failed', []);

    expect(error.message).toBe('validation failed');
  });

  it('stores validationErrors array', () => {
    const validationErrors: ValidationError[] = [
      Object.assign(new ValidationError(), {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
      }),
    ];
    const error = new EventValidationError('failed', validationErrors);

    expect(error.validationErrors).toBe(validationErrors);
  });

  it('stores empty validationErrors array', () => {
    const error = new EventValidationError('no errors', []);

    expect(error.validationErrors).toEqual([]);
  });

  describe('getValidationMessages()', () => {
    it('returns constraint messages from validation errors', () => {
      const validationErrors: ValidationError[] = [
        Object.assign(new ValidationError(), {
          property: 'email',
          constraints: {
            isEmail: 'email must be valid',
            isNotEmpty: 'email should not be empty',
          },
        }),
      ];
      const error = new EventValidationError('failed', validationErrors);
      const messages = error.getValidationMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain('email must be valid');
      expect(messages[0]).toContain('email should not be empty');
    });

    it('returns empty array when no validation errors', () => {
      const error = new EventValidationError('failed', []);
      const messages = error.getValidationMessages();

      expect(messages).toEqual([]);
    });

    it('handles validation errors without constraints', () => {
      const validationErrors: ValidationError[] = [
        Object.assign(new ValidationError(), {
          property: 'field',
          constraints: undefined,
        }),
      ];
      const error = new EventValidationError('failed', validationErrors);
      const messages = error.getValidationMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toBe('');
    });
  });
});
