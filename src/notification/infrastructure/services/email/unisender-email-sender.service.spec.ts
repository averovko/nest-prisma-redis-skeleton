import { ConfigService } from '@nestjs/config';
import { UniSenderEmailSenderService } from './unisender-email-sender.service';
import { NotificationErrorCode } from '../../../domain/errors/notification.error-codes';

describe('UniSenderEmailSenderService', () => {
  let sut: UniSenderEmailSenderService;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          'notification.email.unisender.apiKey': 'unisender-api-key',
          'notification.email.from': 'noreply@test.dev',
          'notification.appName': 'Test App',
        };
        return values[key] ?? defaultValue;
      }),
    };

    sut = new UniSenderEmailSenderService(configService as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends request to UniSender with expected parameters', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ result: { email_id: '123' } }),
    });
    global.fetch = fetchMock;

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, { method: string }];
    expect(url).toContain('https://api.unisender.com/ru/api/sendEmail?');
    expect(url).toContain('api_key=unisender-api-key');
    expect(url).toContain('email=user%40test.dev');
    expect(url).toContain('subject=Subject');
    expect(options).toEqual({ method: 'POST' });
  });

  it('throws NotificationError when API responds with non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toMatchObject({ code: NotificationErrorCode.EMAIL_SEND_FAILED });
  });

  it('throws NotificationError when API payload contains error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
    });

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toMatchObject({ code: NotificationErrorCode.EMAIL_SEND_FAILED });
  });

  it('throws NotificationError when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toMatchObject({ code: NotificationErrorCode.EMAIL_SEND_FAILED });
  });
});
