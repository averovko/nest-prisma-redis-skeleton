import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventSchema } from '../../domain/events/event.interface';
import {
  EventValidationError,
  EventFieldError,
} from '../../domain/errors/event.errors';

export async function validateEventPayload<T extends object>(
  schema: EventSchema<T>,
  payload: T,
): Promise<T> {
  const ctor = schema.schema.constructor as new () => T;
  const instance = plainToInstance(ctor, payload);
  const errors = await validate(instance as object);

  if (errors.length > 0) {
    throw new EventValidationError(
      `Invalid event payload for ${schema.eventName}`,
      mapValidationErrors(errors),
    );
  }

  return instance;
}

function mapValidationErrors(errors: ValidationError[]): EventFieldError[] {
  return errors.map((error) => ({
    field: error.property,
    messages: Object.values(error.constraints ?? {}),
  }));
}
