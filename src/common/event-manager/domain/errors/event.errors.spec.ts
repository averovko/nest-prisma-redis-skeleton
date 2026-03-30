import { EventValidationError, EventFieldError } from './event.errors';

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
    const validationErrors: EventFieldError[] = [
      { field: 'email', messages: ['email must be an email'] },
    ];
    const error = new EventValidationError('failed', validationErrors);

    expect(error.validationErrors).toBe(validationErrors);
  });

  it('stores empty validationErrors array', () => {
    const error = new EventValidationError('no errors', []);

    expect(error.validationErrors).toEqual([]);
  });

  describe('getValidationMessages()', () => {
    it('returns all constraint messages from validation errors', () => {
      const validationErrors: EventFieldError[] = [
        {
          field: 'email',
          messages: ['email must be valid', 'email should not be empty'],
        },
      ];
      const error = new EventValidationError('failed', validationErrors);
      const messages = error.getValidationMessages();

      expect(messages).toHaveLength(2);
      expect(messages).toContain('email must be valid');
      expect(messages).toContain('email should not be empty');
    });

    it('returns empty array when no validation errors', () => {
      const error = new EventValidationError('failed', []);
      const messages = error.getValidationMessages();

      expect(messages).toEqual([]);
    });

    it('returns empty array when validation errors have no messages', () => {
      const validationErrors: EventFieldError[] = [
        { field: 'field', messages: [] },
      ];
      const error = new EventValidationError('failed', validationErrors);
      const messages = error.getValidationMessages();

      expect(messages).toHaveLength(0);
      expect(messages).toEqual([]);
    });
  });
});
