import { InjectEventBus } from './inject-event-bus.decorator';

describe('InjectEventBus decorator', () => {
  it('returns a parameter decorator (function)', () => {
    const decorator = InjectEventBus();

    expect(typeof decorator).toBe('function');
  });

  it('can be applied to a constructor parameter without throwing', () => {
    expect(() => {
      class TestService {
        constructor(@InjectEventBus() _eventBus: unknown) {}
      }
      return TestService;
    }).not.toThrow();
  });
});
