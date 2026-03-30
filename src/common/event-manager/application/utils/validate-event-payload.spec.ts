import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { validateEventPayload } from './validate-event-payload';
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

describe('validateEventPayload()', () => {
  it('resolves with a transformed class instance for a valid payload', async () => {
    const inputPayload: EmailPayload = { email: 'user@example.com', name: 'Alice' };

    const result = await validateEventPayload(emailSchema, inputPayload);

    expect(result).toBeInstanceOf(EmailPayload);
    expect(result.email).toBe('user@example.com');
    expect(result.name).toBe('Alice');
  });

  it('throws EventValidationError when email is invalid', async () => {
    const inputPayload = { email: 'not-an-email', name: 'Alice' } as EmailPayload;

    await expect(
      validateEventPayload(emailSchema, inputPayload),
    ).rejects.toBeInstanceOf(EventValidationError);
  });

  it('throws EventValidationError when required field is empty', async () => {
    const inputPayload = { email: 'user@example.com', name: '' } as EmailPayload;

    await expect(
      validateEventPayload(emailSchema, inputPayload),
    ).rejects.toBeInstanceOf(EventValidationError);
  });

  it('includes eventName in the error message', async () => {
    const inputPayload = { email: 'bad', name: '' } as EmailPayload;

    await expect(
      validateEventPayload(emailSchema, inputPayload),
    ).rejects.toThrow('user.registered');
  });

  it('throws EventValidationError with populated validationErrors', async () => {
    const inputPayload = { email: 'bad', name: '' } as EmailPayload;

    try {
      await validateEventPayload(emailSchema, inputPayload);
      fail('should have thrown');
    } catch (err) {
      const actualError = err as EventValidationError;
      expect(actualError.validationErrors.length).toBeGreaterThan(0);
      expect(actualError.validationErrors[0]).toHaveProperty('field');
      expect(actualError.validationErrors[0]).toHaveProperty('messages');
    }
  });

  it('throws EventValidationError when both fields are invalid', async () => {
    const inputPayload = { email: 'bad', name: '' } as EmailPayload;

    try {
      await validateEventPayload(emailSchema, inputPayload);
      fail('should have thrown');
    } catch (err) {
      const actualError = err as EventValidationError;
      expect(actualError.validationErrors.length).toBeGreaterThanOrEqual(2);
    }
  });
});
