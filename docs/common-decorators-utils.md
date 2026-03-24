# `src/common/decorators` & `src/common/utils` — Decorators & Utilities

> **Context document for AI-assisted code generation.**
> Covers `@Retry()` method decorator and `delay()` utility function.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Folder Structure](#folder-structure)
3. [decorators/retry.decorator.ts — `@Retry()`](#decoratorsretrydecoratorts--retry)
4. [utils/delay.ts — `delay()`](#utilsdelayts--delay)
5. [Usage Patterns](#usage-patterns)
6. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

These two small modules provide **cross-cutting resilience and async utilities**:

- `@Retry()` — a method decorator that automatically retries an async method on failure, with configurable backoff strategy and error filtering.
- `delay(ms)` — a promise-based sleep utility used internally by `@Retry()` and available for any async timing needs.

Neither requires NestJS DI or module registration.

---

## Folder Structure

```
src/common/decorators/
├── index.ts              export { Retry }
└── retry.decorator.ts    @Retry() decorator + RetryOptions interface

src/common/utils/
├── index.ts              export { delay }
└── delay.ts              delay(ms) utility
```

---

## `decorators/retry.decorator.ts` — `@Retry()`

### `RetryOptions`

```typescript
interface RetryOptions {
  maxAttempts?: number;                              // Default: 3
  backoffMs?: number;                               // Default: 1000 (ms)
  exponential?: boolean;                            // Default: true
  retryableErrors?: Array<new (...args: any[]) => Error>; // Default: [Error]
}
```

| Option | Default | Description |
|---|---|---|
| `maxAttempts` | `3` | Total number of attempts (including the first). Minimum effective retries = `maxAttempts - 1`. |
| `backoffMs` | `1000` | Initial wait between attempts in milliseconds. |
| `exponential` | `true` | If `true`, wait doubles each attempt: 1000ms, 2000ms, 4000ms, … |
| `retryableErrors` | `[Error]` | Only retry when the thrown error is an instance of one of these classes. Errors not matching are rethrown immediately. |

### `Retry(options?)` Decorator

A **method decorator** factory for async class methods:

```typescript
export function Retry(options: RetryOptions = {}): MethodDecorator
```

**Behavior per attempt:**
1. Calls the original method.
2. On success → returns the result.
3. On error:
   - If error is NOT an instance of any `retryableErrors` class → rethrows immediately (no retry).
   - If `attempt === maxAttempts` → logs error (level: `error`) with attempt count and method name → rethrows.
   - Otherwise → logs warning (level: `warn`) with attempt number, method name, error message, and next wait → calls `delay(waitMs)` → if `exponential`, doubles `waitMs` → continues to next attempt.

**Logging:** Uses `new Logger(target.constructor.name)` — the log output is attributed to the class owning the decorated method.

**Important:** Only works on `async` methods (returns a `Promise`). Synchronous methods wrapped with `@Retry()` will behave correctly only if errors are thrown synchronously before any `await`.

---

## `utils/delay.ts` — `delay()`

```typescript
function delay(ms: number): Promise<void>
```

Resolves after `ms` milliseconds. Thin wrapper around `setTimeout`:

```typescript
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
```

Used by `@Retry()` between attempts. Can also be used directly in tests, polling loops, or rate-limited operations.

---

## Usage Patterns

### Basic retry on any error

```typescript
import { Injectable } from '@nestjs/common';
import { Retry } from 'src/common/decorators';

@Injectable()
export class ExternalApiService {

  @Retry()
  async fetchData(id: string): Promise<Data> {
    return this.httpClient.get(`/data/${id}`);
  }
}
// Retries up to 3 times total with 1s, 2s backoff on any Error.
```

---

### Retry with custom options

```typescript
@Retry({
  maxAttempts: 5,
  backoffMs: 500,
  exponential: true,
  // retries on: 500ms, 1000ms, 2000ms, 4000ms
})
async callExternalService(): Promise<void> { ... }
```

---

### Retry only on specific error types

```typescript
class NetworkError extends Error {}
class TimeoutError extends Error {}

@Retry({
  maxAttempts: 3,
  backoffMs: 2000,
  exponential: false,        // Fixed 2000ms between attempts
  retryableErrors: [NetworkError, TimeoutError],
})
async sendRequest(): Promise<Response> { ... }
// ValidationError, not-found errors, etc. are NOT retried — rethrown immediately
```

---

### Linear (non-exponential) backoff

```typescript
@Retry({
  maxAttempts: 4,
  backoffMs: 1000,
  exponential: false,   // Waits exactly 1000ms between every attempt
})
async pollStatus(): Promise<Status> { ... }
```

---

### Using `delay()` directly

```typescript
import { delay } from 'src/common/utils';

async pollUntilReady(id: string): Promise<void> {
  let ready = false;
  while (!ready) {
    ready = await this.checkStatus(id);
    if (!ready) {
      await delay(2000); // Wait 2 seconds before next poll
    }
  }
}
```

---

### Using `delay()` in tests

```python
# Use Python for test scripts (per project rules), but for unit test files:
```

```typescript
it('should retry on failure', async () => {
  jest.useFakeTimers();
  // ... setup mocks ...
  const promise = service.fetchData('id');
  jest.advanceTimersByTime(3000);
  await promise;
});
```

---

## Public Barrel Exports

From `src/common/decorators/index.ts`:

```typescript
export { Retry } from './retry.decorator';
```

From `src/common/utils/index.ts`:

```typescript
export { delay } from './delay';
```

From `src/common/index.ts`:

```typescript
export * from './decorators';  // → Retry
export * from './utils';       // → delay
```

Import paths:

```typescript
import { Retry } from 'src/common/decorators';
import { delay } from 'src/common/utils';
// or
import { Retry, delay } from 'src/common';
```
