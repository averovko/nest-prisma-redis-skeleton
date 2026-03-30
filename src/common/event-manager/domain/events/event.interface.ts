export interface EventMetadata {
  correlationId?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  version: string;
}

export interface EventSchema<T = unknown> {
  readonly eventName: string;
  readonly schema: T;
  readonly version: string;
  readonly module: string;
  readonly description: string;
}

export interface EventBusMessage<T = unknown> {
  readonly eventId: string;
  readonly eventName: string;
  readonly payload: T;
  readonly metadata: EventMetadata;
}
