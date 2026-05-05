import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventSchema } from '../../domain/events/event.interface';
import { EventValidationError } from '../../domain/errors/event.errors';
import { EventRegistryPort } from '../../application/ports/event-registry.port';
import { AuthenticationEventSchemas } from '../../application/schemas/authentication.events';
import { IdentityEventSchemas } from '../../application/schemas/identity.events';
import { InvitationEventSchemas } from '../../application/schemas/invitation.events';

@Injectable()
export class EventRegistryService implements OnModuleInit, EventRegistryPort {
  private readonly logger = new Logger(EventRegistryService.name);
  private readonly registry = new Map<string, EventSchema<object>>();

  onModuleInit() {
    this.registerEventSchemas(
      AuthenticationEventSchemas as Record<string, EventSchema<object>>,
    );
    this.registerEventSchemas(
      IdentityEventSchemas as Record<string, EventSchema<object>>,
    );
    this.registerEventSchemas(
      InvitationEventSchemas as Record<string, EventSchema<object>>,
    );

    this.logger.log(`Registered ${this.registry.size} event types`);
  }

  private registerEventSchemas(
    schemas: Record<string, EventSchema<object>>,
  ): void {
    Object.values(schemas).forEach((schema) => {
      this.registerEventType(schema);
    });
  }

  registerEventType<T extends object>(schema: EventSchema<T>): void {
    if (!schema.eventName || !schema.schema || !schema.version) {
      throw new EventValidationError('Invalid event schema structure', []);
    }

    if (this.registry.has(schema.eventName)) {
      throw new EventValidationError(
        `Event type ${schema.eventName} already registered`,
        [],
      );
    }

    this.registry.set(schema.eventName, schema);
    this.logger.debug(
      `Registered event type ${schema.eventName} (v${schema.version})`,
    );
  }

  getEventSchema<T extends object>(
    eventName: string,
  ): EventSchema<T> | undefined {
    const schema = this.registry.get(eventName);
    return schema ? (schema as EventSchema<T>) : undefined;
  }

  hasEventType(eventName: string): boolean {
    return this.registry.has(eventName);
  }

  getAllEventTypes(): EventSchema<object>[] {
    return Array.from(this.registry.values());
  }

  getEventTypesByModule(module: string): EventSchema<object>[] {
    return this.getAllEventTypes().filter((schema) => schema.module === module);
  }
}
