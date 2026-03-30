import { v7 as uuidv7 } from 'uuid';
import { EventBusMessage, EventMetadata, EventSchema } from './event.interface';

export abstract class BaseEvent<
  T extends object = object,
> implements EventBusMessage<T> {
  public readonly eventId: string;
  public readonly eventName: string;
  public readonly metadata: EventMetadata;
  protected readonly schema: EventSchema<T>;

  constructor(
    schema: EventSchema<T>,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    this.schema = schema;
    this.eventId = uuidv7();
    this.eventName = schema.eventName;

    this.metadata = {
      correlationId: params?.correlationId,
      metadata: params?.metadata,
      timestamp: Date.now(),
      version: schema.version,
    };
  }

  abstract toJSON(): T;

  get payload(): T {
    return this.toJSON();
  }

  getSchema(): EventSchema<T> {
    return this.schema;
  }

  getPartitionKey(): string {
    return this.eventId;
  }
}
