import { IsString, IsNotEmpty } from 'class-validator';
import { EventBusAdapter } from './event-bus.adapter';
import { BaseEvent } from '../entities/events/base.event';
import { EventSchema } from '../entities/events/event.interface';
import { EventValidationError } from '../entities/errors/event.errors';

class SimplePayload {
  @IsString()
  @IsNotEmpty()
  data: string;
}

const simpleSchema: EventSchema<SimplePayload> = {
  eventName: 'test.simple.event',
  schema: new SimplePayload(),
  version: '1.0.0',
  module: 'test',
  description: 'Simple test event',
};

class SimpleEvent extends BaseEvent<SimplePayload> {
  constructor(private readonly data: string) {
    super(simpleSchema);
  }

  toJSON(): SimplePayload {
    return { data: this.data };
  }
}

class InvalidEvent extends BaseEvent<SimplePayload> {
  constructor() {
    super(simpleSchema);
  }

  toJSON(): SimplePayload {
    return { data: '' };
  }
}

describe('EventBusAdapter', () => {
  let adapter: EventBusAdapter;
  const mockEmitAsync = jest.fn().mockResolvedValue([]);
  const mockEventEmitter = { emitAsync: mockEmitAsync } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new EventBusAdapter(mockEventEmitter);
  });

  describe('publish()', () => {
    it('emits event with correct EventBusMessage structure', async () => {
      const event = new SimpleEvent('hello');

      await adapter.publish(event);

      expect(mockEmitAsync).toHaveBeenCalledTimes(1);
      const [eventName, message] = mockEmitAsync.mock.calls[0];
      expect(eventName).toBe('test.simple.event');
      expect(message.eventId).toBe(event.eventId);
      expect(message.eventName).toBe('test.simple.event');
      expect(message.payload).toEqual({ data: 'hello' });
      expect(message.metadata).toBeDefined();
    });

    it('throws EventValidationError and does not emit when validation fails', async () => {
      const event = new InvalidEvent();

      await expect(adapter.publish(event)).rejects.toBeInstanceOf(
        EventValidationError,
      );
      expect(mockEmitAsync).not.toHaveBeenCalled();
    });

    it('rethrows errors from emitAsync', async () => {
      const event = new SimpleEvent('hello');
      const emitError = new Error('EventEmitter failure');
      mockEmitAsync.mockRejectedValueOnce(emitError);

      await expect(adapter.publish(event)).rejects.toThrow(
        'EventEmitter failure',
      );
    });

    it('includes metadata in the emitted message', async () => {
      const event = new SimpleEvent('test');

      await adapter.publish(event);

      const [, message] = mockEmitAsync.mock.calls[0];
      expect(message.metadata.version).toBe('1.0.0');
      expect(typeof message.metadata.timestamp).toBe('number');
    });
  });
});
