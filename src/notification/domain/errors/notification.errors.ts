import { NotificationErrorCode } from './notification.error-codes';

export class NotificationError extends Error {
  constructor(
    public readonly code: NotificationErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}
