import { Logger } from '@nestjs/common';
import { delay } from '../utils/delay';

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  exponential?: boolean;
  retryableErrors?: Array<new (...args: any[]) => Error>;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  backoffMs: 1000,
  exponential: true,
  retryableErrors: [Error],
};

export function Retry(options: RetryOptions = {}) {
  const finalOptions = { ...defaultOptions, ...options };

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      let lastError: Error = new Error('Unknown error');
      let waitMs = finalOptions.backoffMs;

      for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt += 1) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          const isRetryable = finalOptions.retryableErrors.some(
            (errorType) => error instanceof errorType,
          );

          if (!isRetryable) {
            throw error;
          }

          if (attempt === finalOptions.maxAttempts) {
            logger.error(
              `Failed after ${attempt} attempts for ${propertyKey}: ${error.message}`,
            );
            throw error;
          }

          logger.warn(
            `Attempt ${attempt} failed for ${propertyKey}: ${error.message}. Retrying in ${waitMs}ms...`,
          );

          await delay(waitMs);

          if (finalOptions.exponential) {
            waitMs *= 2;
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
