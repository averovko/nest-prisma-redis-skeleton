import { Injectable } from '@nestjs/common';
import { EventSchema } from '../../domain/events/event.interface';
import { EventValidatorPort } from '../../application/ports/event-validator.port';
import { validateEventPayload } from '../../application/utils/validate-event-payload';

@Injectable()
export class EventValidator implements EventValidatorPort {
  async validate<T extends object>(
    schema: EventSchema<T>,
    payload: T,
  ): Promise<void> {
    await validateEventPayload(schema, payload);
  }
}
