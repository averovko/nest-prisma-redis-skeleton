import { NotificationErrorFactory } from './notification.error-factory';
import { NotificationErrorCode } from './notification.error-codes';
import { NotificationError } from './notification.errors';

describe('NotificationErrorFactory', () => {
  describe('emailSendFailed', () => {
    it('returns NotificationError with EMAIL_SEND_FAILED code', () => {
      const error = NotificationErrorFactory.emailSendFailed();
      expect(error).toBeInstanceOf(NotificationError);
      expect(error.code).toBe(NotificationErrorCode.EMAIL_SEND_FAILED);
    });

    it('attaches cause when provided', () => {
      const cause = new Error('SMTP timeout');
      const error = NotificationErrorFactory.emailSendFailed(cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('smsSendFailed', () => {
    it('returns NotificationError with SMS_SEND_FAILED code', () => {
      const error = NotificationErrorFactory.smsSendFailed();
      expect(error).toBeInstanceOf(NotificationError);
      expect(error.code).toBe(NotificationErrorCode.SMS_SEND_FAILED);
    });
  });

  describe('templateNotFound', () => {
    it('returns NotificationError with TEMPLATE_NOT_FOUND code and template name in message', () => {
      const error = NotificationErrorFactory.templateNotFound('emails/welcome');
      expect(error).toBeInstanceOf(NotificationError);
      expect(error.code).toBe(NotificationErrorCode.TEMPLATE_NOT_FOUND);
      expect(error.message).toContain('emails/welcome');
    });
  });

  describe('templateRenderFailed', () => {
    it('returns NotificationError with TEMPLATE_RENDER_FAILED code', () => {
      const error = NotificationErrorFactory.templateRenderFailed('emails/welcome');
      expect(error.code).toBe(NotificationErrorCode.TEMPLATE_RENDER_FAILED);
      expect(error.message).toContain('emails/welcome');
    });
  });

  describe('invalidPayload', () => {
    it('returns NotificationError with INVALID_PAYLOAD code', () => {
      const error = NotificationErrorFactory.invalidPayload('email is required');
      expect(error.code).toBe(NotificationErrorCode.INVALID_PAYLOAD);
      expect(error.message).toContain('email is required');
    });
  });
});
