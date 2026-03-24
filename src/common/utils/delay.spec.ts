import { delay } from './delay';

describe('delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Promise', () => {
    const result = delay(100);
    jest.runAllTimers();

    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to undefined after the specified ms', async () => {
    const promise = delay(1000);
    jest.runAllTimers();

    await expect(promise).resolves.toBeUndefined();
  });

  it('does not resolve before the timeout elapses', async () => {
    let resolved = false;
    const promise = delay(1000).then(() => {
      resolved = true;
    });

    jest.advanceTimersByTime(999);
    await Promise.resolve();

    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;

    expect(resolved).toBe(true);
  });

  it('resolves immediately for 0 ms', async () => {
    const promise = delay(0);
    jest.runAllTimers();

    await expect(promise).resolves.toBeUndefined();
  });
});
