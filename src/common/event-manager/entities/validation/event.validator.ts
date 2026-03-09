import { validate } from 'class-validator';
import { EventValidationError } from '../errors/event.errors';
import { EventSchema } from '../events/event.interface';
import { plainToInstance } from 'class-transformer';

/**
 * Validates event payloads against their schema definitions
 */
export class EventValidator {
  /**
   * Validates an event payload against its schema
   * @throws EventValidationError if validation fails
   */
  public static async validate<T extends object>(
    schema: EventSchema<T>,
    payload: T,
  ): Promise<void> {
    const ctor = schema.schema.constructor as new () => T;
    const instance = plainToInstance(ctor, payload);
    const errors = await validate(instance as object);

    if (errors.length > 0) {
      throw new EventValidationError(
        `Invalid event payload for ${schema.eventName}`,
        errors,
      );
    }
  }
}
