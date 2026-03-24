import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { EventValidator } from './event.validator';
import { EventSchema } from '../events/event.interface';
import { EventValidationError } from '../errors/event.errors';

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

describe('EventValidator.validate()', () => {
  it('resolves without error for a valid payload', async () => {
    const payload: EmailPayload = { email: 'user@example.com', name: 'Alice' };

    await expect(
      EventValidator.validate(emailSchema, payload),
    ).resolves.toBeUndefined();
  });

  it('throws EventValidationError when email is invalid', async () => {
    const payload = { email: 'not-an-email', name: 'Alice' } as EmailPayload;

    await expect(
      EventValidator.validate(emailSchema, payload),
    ).rejects.toBeInstanceOf(EventValidationError);
  });

  it('throws EventValidationError when required field is missing', async () => {
    const payload = { email: 'user@example.com', name: '' } as EmailPayload;

    await expect(
      EventValidator.validate(emailSchema, payload),
    ).rejects.toBeInstanceOf(EventValidationError);
  });

  it('includes eventName in the error message', async () => {
    const payload = { email: 'bad', name: '' } as EmailPayload;

    await expect(
      EventValidator.validate(emailSchema, payload),
    ).rejects.toThrow('user.registered');
  });

  it('throws EventValidationError with populated validationErrors', async () => {
    const payload = { email: 'bad', name: '' } as EmailPayload;

    try {
      await EventValidator.validate(emailSchema, payload);
      fail('should have thrown');
    } catch (err) {
      const error = err as EventValidationError;
      expect(error.validationErrors.length).toBeGreaterThan(0);
    }
  });
});
