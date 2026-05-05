import { NotificationError } from './notification.errors';
import { NotificationErrorCode } from './notification.error-codes';

export class NotificationErrorFactory {
  static emailSendFailed(cause?: unknown): NotificationError {
    return new NotificationError(
      NotificationErrorCode.EMAIL_SEND_FAILED,
      'Failed to send email notification',
      cause,
    );
  }

  static smsSendFailed(cause?: unknown): NotificationError {
    return new NotificationError(
      NotificationErrorCode.SMS_SEND_FAILED,
      'Failed to send SMS notification',
      cause,
    );
  }

  static templateNotFound(templateName: string): NotificationError {
    return new NotificationError(
      NotificationErrorCode.TEMPLATE_NOT_FOUND,
      `Template not found: ${templateName}`,
    );
  }

  static templateRenderFailed(templateName: string, cause?: unknown): NotificationError {
    return new NotificationError(
      NotificationErrorCode.TEMPLATE_RENDER_FAILED,
      `Failed to render template: ${templateName}`,
      cause,
    );
  }

  static invalidPayload(message: string): NotificationError {
    return new NotificationError(
      NotificationErrorCode.INVALID_PAYLOAD,
      `Invalid notification payload: ${message}`,
    );
  }
}
