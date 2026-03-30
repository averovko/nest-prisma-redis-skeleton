import { EventSchema } from '../../domain/events/event.interface';

export const EVENT_REGISTRY_TOKEN = Symbol('EventRegistryPort');

export interface EventRegistryPort {
  registerEventType<T extends object>(schema: EventSchema<T>): void;
  getEventSchema<T extends object>(eventName: string): EventSchema<T> | undefined;
  hasEventType(eventName: string): boolean;
  getAllEventTypes(): EventSchema<object>[];
  getEventTypesByModule(module: string): EventSchema<object>[];
}
