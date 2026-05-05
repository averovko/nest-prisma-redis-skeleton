import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { EventValidator } from './event-validator';
import { EventSchema } from '../../domain/events/event.interface';
import { EventValidationError } from '../../domain/errors/event.errors';

class EmailPayload {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

const emailSchema: EventSchema<EmailPayload> = {
  eventName: 'user.registered',
  schema: new EmailPayload(),
  version: '1.0.0',
  module: 'auth',
  description: 'User registered',
};

describe('EventValidator', () => {
  let validator: EventValidator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  describe('validate()', () => {
    it('resolves without error for a valid payload', async () => {
      const inputPayload: EmailPayload = {
        email: 'user@example.com',
        name: 'Alice',
      };

      await expect(
        validator.validate(emailSchema, inputPayload),
      ).resolves.toBeUndefined();
    });

    it('throws EventValidationError when email is invalid', async () => {
      const inputPayload = {
        email: 'not-an-email',
        name: 'Alice',
      } as EmailPayload;

      await expect(
        validator.validate(emailSchema, inputPayload),
      ).rejects.toBeInstanceOf(EventValidationError);
    });

    it('throws EventValidationError when required field is missing', async () => {
      const inputPayload = {
        email: 'user@example.com',
        name: '',
      } as EmailPayload;

      await expect(
        validator.validate(emailSchema, inputPayload),
      ).rejects.toBeInstanceOf(EventValidationError);
    });

    it('includes eventName in the error message', async () => {
      const inputPayload = { email: 'bad', name: '' } as EmailPayload;

      await expect(
        validator.validate(emailSchema, inputPayload),
      ).rejects.toThrow('user.registered');
    });

    it('throws EventValidationError with populated validationErrors', async () => {
      const inputPayload = { email: 'bad', name: '' } as EmailPayload;

      try {
        await validator.validate(emailSchema, inputPayload);
        fail('should have thrown');
      } catch (err) {
        const actualError = err as EventValidationError;
        expect(actualError.validationErrors.length).toBeGreaterThan(0);
        expect(actualError.validationErrors[0]).toHaveProperty('field');
        expect(actualError.validationErrors[0]).toHaveProperty('messages');
      }
    });
  });
});
