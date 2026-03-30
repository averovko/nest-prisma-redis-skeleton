import { EventSchema } from '../../domain/events/event.interface';

export const EVENT_VALIDATOR_TOKEN = Symbol('EventValidatorPort');

export interface EventValidatorPort {
  validate<T extends object>(schema: EventSchema<T>, payload: T): Promise<void>;
}
