import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from '../../domain/events/base.event';
import { EventBusMessage } from '../../domain/events/event.interface';
import { EventValidationError } from '../../domain/errors/event.errors';
import { EventBusPort } from '../../application/ports/event-bus.port';
import {
  type EventValidatorPort,
  EVENT_VALIDATOR_TOKEN,
} from '../../application/ports/event-validator.port';

@Injectable()
export class EventBusAdapter implements EventBusPort {
  private readonly logger = new Logger(EventBusAdapter.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(EVENT_VALIDATOR_TOKEN)
    private readonly eventValidator: EventValidatorPort,
  ) {}

  async publish<T extends object>(event: BaseEvent<T>): Promise<void> {
    try {
      await this.eventValidator.validate(event.getSchema(), event.payload);

      const message: EventBusMessage<T> = {
        eventId: event.eventId,
        eventName: event.eventName,
        payload: event.payload,
        metadata: event.metadata,
      };

      await this.eventEmitter.emitAsync(event.eventName, message);
    } catch (error) {
      if (error instanceof EventValidationError) {
        this.logger.error(
          `Event validation failed for ${event.eventName}: ${error.message}`,
          error.getValidationMessages(),
        );
        throw error;
      }

      this.logger.error(
        `Failed to emit event ${event.eventName}: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
