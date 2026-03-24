jest.mock('../utils/delay', () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));

import { Retry } from './retry.decorator';
import { delay } from '../utils/delay';

const mockDelay = delay as jest.MockedFunction<typeof delay>;

describe('Retry decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls original method and returns result on first success', async () => {
    class Service {
      @Retry()
      async doWork(): Promise<string> {
        return 'ok';
      }
    }

    const result = await new Service().doWork();

    expect(result).toBe('ok');
    expect(mockDelay).not.toHaveBeenCalled();
  });

  it('retries on retryable error and returns value on second attempt', async () => {
    let attempts = 0;

    class Service {
      @Retry({ maxAttempts: 3 })
      async doWork(): Promise<string> {
        attempts += 1;
        if (attempts < 2) throw new Error('transient failure');
        return 'recovered';
      }
    }

    const result = await new Service().doWork();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
    expect(mockDelay).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting maxAttempts', async () => {
    class Service {
      @Retry({ maxAttempts: 2 })
      async doWork(): Promise<void> {
        throw new Error('always fails');
      }
    }

    await expect(new Service().doWork()).rejects.toThrow('always fails');
    expect(mockDelay).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable error class', async () => {
    class SpecificError extends Error {}
    let attempts = 0;

    class Service {
      @Retry({ retryableErrors: [TypeError] })
      async doWork(): Promise<void> {
        attempts += 1;
        throw new SpecificError('not retryable');
      }
    }

    await expect(new Service().doWork()).rejects.toBeInstanceOf(SpecificError);
    expect(attempts).toBe(1);
    expect(mockDelay).not.toHaveBeenCalled();
  });

  it('retries when error matches retryableErrors class', async () => {
    let attempts = 0;

    class Service {
      @Retry({ maxAttempts: 3, retryableErrors: [TypeError] })
      async doWork(): Promise<string> {
        attempts += 1;
        if (attempts < 2) throw new TypeError('type error');
        return 'ok';
      }
    }

    const result = await new Service().doWork();

    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('doubles backoffMs on each attempt when exponential=true', async () => {
    class Service {
      @Retry({ maxAttempts: 3, backoffMs: 100, exponential: true })
      async doWork(): Promise<void> {
        throw new Error('fail');
      }
    }

    await expect(new Service().doWork()).rejects.toThrow();

    expect(mockDelay).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenNthCalledWith(1, 100);
    expect(mockDelay).toHaveBeenNthCalledWith(2, 200);
  });

  it('uses constant backoffMs when exponential=false', async () => {
    class Service {
      @Retry({ maxAttempts: 3, backoffMs: 500, exponential: false })
      async doWork(): Promise<void> {
        throw new Error('fail');
      }
    }

    await expect(new Service().doWork()).rejects.toThrow();

    expect(mockDelay).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenNthCalledWith(1, 500);
    expect(mockDelay).toHaveBeenNthCalledWith(2, 500);
  });

  it('uses default options when none are provided', async () => {
    let attempts = 0;

    class Service {
      @Retry()
      async doWork(): Promise<void> {
        attempts += 1;
        throw new Error('fail');
      }
    }

    await expect(new Service().doWork()).rejects.toThrow();
    expect(attempts).toBe(3);
  });

  it('throws immediately when maxAttempts is 0 (loop never executes)', async () => {
    class Service {
      @Retry({ maxAttempts: 0 })
      async doWork(): Promise<void> {
        throw new Error('should not run');
      }
    }

    await expect(new Service().doWork()).rejects.toThrow();
  });
});
