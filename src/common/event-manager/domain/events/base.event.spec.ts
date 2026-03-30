import { IsString, IsNotEmpty } from 'class-validator';
import { BaseEvent } from './base.event';
import { EventSchema } from './event.interface';

class TestPayload {
  @IsString()
  @IsNotEmpty()
  value: string;
}

const testSchema: EventSchema<TestPayload> = {
  eventName: 'test.event.created',
  schema: new TestPayload(),
  version: '1.0.0',
  module: 'test',
  description: 'A test event',
};

class ValidTestEvent extends BaseEvent<TestPayload> {
  constructor(
    private readonly value: string,
    params?: { correlationId?: string },
  ) {
    super(testSchema, params);
  }

  toJSON(): TestPayload {
    return { value: this.value };
  }
}

describe('BaseEvent', () => {
  describe('constructor', () => {
    it('assigns a non-empty eventId string', () => {
      const event = new ValidTestEvent('hello');

      expect(typeof event.eventId).toBe('string');
      expect(event.eventId.length).toBeGreaterThan(0);
    });

    it('sets eventName from schema', () => {
      const event = new ValidTestEvent('hello');

      expect(event.eventName).toBe('test.event.created');
    });

    it('sets metadata.version from schema version', () => {
      const event = new ValidTestEvent('hello');

      expect(event.metadata.version).toBe('1.0.0');
    });

    it('sets metadata.timestamp as a number', () => {
      const event = new ValidTestEvent('hello');

      expect(typeof event.metadata.timestamp).toBe('number');
    });

    it('stores optional correlationId in metadata', () => {
      const event = new ValidTestEvent('hello', {
        correlationId: 'corr-123',
      });

      expect(event.metadata.correlationId).toBe('corr-123');
    });

    it('leaves correlationId undefined when not provided', () => {
      const event = new ValidTestEvent('hello');

      expect(event.metadata.correlationId).toBeUndefined();
    });
  });

  describe('payload getter', () => {
    it('delegates to toJSON()', () => {
      const event = new ValidTestEvent('world');

      expect(event.payload).toEqual({ value: 'world' });
    });
  });

  describe('getSchema()', () => {
    it('returns the schema passed to constructor', () => {
      const event = new ValidTestEvent('hello');

      expect(event.getSchema()).toBe(testSchema);
    });
  });

  describe('getPartitionKey()', () => {
    it('returns the eventId by default', () => {
      const event = new ValidTestEvent('hello');

      expect(event.getPartitionKey()).toBe(event.eventId);
    });
  });

  describe('eventId uniqueness', () => {
    it('generates unique eventIds for each instance', () => {
      const e1 = new ValidTestEvent('a');
      const e2 = new ValidTestEvent('b');

      expect(e1.eventId).not.toBe(e2.eventId);
    });
  });
});
