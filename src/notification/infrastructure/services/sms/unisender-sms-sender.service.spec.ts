import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UniSenderSmsSenderService } from './unisender-sms-sender.service';
import { NotificationErrorCode } from '../../../domain/errors/notification.error-codes';

describe('UniSenderSmsSenderService', () => {
  let sut: UniSenderSmsSenderService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, def?: unknown) => {
        const config: Record<string, unknown> = {
          'notification.sms.unisender.apiKey': 'test-api-key',
          'notification.sms.unisender.senderName': 'TestApp',
        };
        return config[key] ?? def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniSenderSmsSenderService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    sut = module.get(UniSenderSmsSenderService);
  });

  describe('send', () => {
    it('throws NotificationError with SMS_SEND_FAILED when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(
        sut.send({ to: '+79001234567', body: 'Test SMS' }),
      ).rejects.toMatchObject({ code: NotificationErrorCode.SMS_SEND_FAILED });
    });

    it('throws NotificationError with SMS_SEND_FAILED when API returns error status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn(),
      });

      await expect(
        sut.send({ to: '+79001234567', body: 'Test SMS' }),
      ).rejects.toMatchObject({ code: NotificationErrorCode.SMS_SEND_FAILED });
    });

    it('throws NotificationError when API returns error in body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
      });

      await expect(
        sut.send({ to: '+79001234567', body: 'Test SMS' }),
      ).rejects.toMatchObject({ code: NotificationErrorCode.SMS_SEND_FAILED });
    });

    it('resolves without error on successful response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ result: { sms_id: '12345' } }),
      });

      await expect(
        sut.send({ to: '+79001234567', body: 'Test SMS' }),
      ).resolves.toBeUndefined();
    });
  });
});
