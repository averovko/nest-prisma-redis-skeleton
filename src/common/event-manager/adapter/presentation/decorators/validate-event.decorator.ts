import { Logger } from '@nestjs/common';
import { EventValidationError } from '../../../domain/errors/event.errors';
import { BaseEvent } from '../../../domain/events/base.event';
import { validateEventPayload } from '../../../application/utils/validate-event-payload';

export function ValidateEvent() {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value;
    const logger = new Logger('ValidateEvent');

    return {
      ...descriptor,
      async value(...args: any[]) {
        const event = args[0] as BaseEvent;

        if (!event?.eventName || !event?.payload) {
          throw new EventValidationError('Invalid event structure', []);
        }

        try {
          const schema = event.getSchema();
          if (!schema) {
            throw new EventValidationError('Event schema not found', []);
          }

          const payloadInstance = await validateEventPayload(schema, event.payload);

          return originalMethod.apply(this, [
            { ...event, payload: payloadInstance },
          ]);
        } catch (error) {
          logger.error(
            `Event validation failed for ${event.eventName}: ${error.message}`,
            error.stack,
          );

          if (error instanceof EventValidationError) {
            throw error;
          }

          throw new EventValidationError(
            `Event validation failed: ${error.message}`,
            [],
          );
        }
      },
    };
  };
}
