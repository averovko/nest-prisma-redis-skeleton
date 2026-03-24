import { IsString, IsNotEmpty } from 'class-validator';
import { ValidateEvent } from './validate-event.decorator';
import { BaseEvent } from '../../entities/events/base.event';
import { EventSchema } from '../../entities/events/event.interface';
import { EventValidationError } from '../../entities/errors/event.errors';

class TestPayload {
  @IsString()
  @IsNotEmpty()
  message: string;
}

const testSchema: EventSchema<TestPayload> = {
  eventName: 'test.validated.event',
  schema: new TestPayload(),
  version: '1.0.0',
  module: 'test',
  description: 'Test validated event',
};

class ValidEvent extends BaseEvent<TestPayload> {
  constructor(private readonly msg: string) {
    super(testSchema);
  }

  toJSON(): TestPayload {
    return { message: this.msg };
  }
}

class InvalidEvent extends BaseEvent<TestPayload> {
  constructor() {
    super(testSchema);
  }

  toJSON(): TestPayload {
    return { message: '' };
  }
}

class TestHandler {
  handledPayload: unknown = null;

  @ValidateEvent()
  async handle(event: BaseEvent<TestPayload>): Promise<string> {
    this.handledPayload = event.payload;
    return 'handled';
  }
}

describe('ValidateEvent decorator', () => {
  let handler: TestHandler;

  beforeEach(() => {
    handler = new TestHandler();
  });

  it('calls the original method when event is valid', async () => {
    const event = new ValidEvent('hello');
    const result = await handler.handle(event);

    expect(result).toBe('handled');
  });

  it('throws EventValidationError when event has empty eventName', async () => {
    const malformed = { payload: { message: 'ok' } } as unknown as BaseEvent<TestPayload>;

    await expect(handler.handle(malformed)).rejects.toBeInstanceOf(
      EventValidationError,
    );
  });

  it('throws EventValidationError when event payload is missing', async () => {
    const malformed = {
      eventName: 'some.event',
    } as unknown as BaseEvent<TestPayload>;

    await expect(handler.handle(malformed)).rejects.toBeInstanceOf(
      EventValidationError,
    );
  });

  it('throws EventValidationError when payload is invalid', async () => {
    const event = new InvalidEvent();

    await expect(handler.handle(event)).rejects.toBeInstanceOf(
      EventValidationError,
    );
  });

  it('throws EventValidationError when event has no schema', async () => {
    const event = new ValidEvent('hello');
    jest.spyOn(event, 'getSchema').mockReturnValue(null as any);

    await expect(handler.handle(event)).rejects.toBeInstanceOf(
      EventValidationError,
    );
  });

  it('wraps non-EventValidationError thrown during processing into EventValidationError', async () => {
    const event = new ValidEvent('hello');
    jest.spyOn(event, 'getSchema').mockImplementation(() => {
      throw new Error('unexpected processing error');
    });

    await expect(handler.handle(event)).rejects.toBeInstanceOf(
      EventValidationError,
    );
  });
});
