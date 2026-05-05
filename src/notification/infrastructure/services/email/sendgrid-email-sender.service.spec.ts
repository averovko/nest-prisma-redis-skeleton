import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { SendGridEmailSenderService } from './sendgrid-email-sender.service';
import { NotificationErrorCode } from '../../../domain/errors/notification.error-codes';

jest.mock('@sendgrid/mail', () => ({
  send: jest.fn(),
}));

describe('SendGridEmailSenderService', () => {
  let sut: SendGridEmailSenderService;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          'notification.email.sendgrid.apiKey': 'sg-api-key',
          'notification.email.from': 'noreply@test.dev',
        };
        return values[key] ?? defaultValue;
      }),
    };

    sut = new SendGridEmailSenderService(
      configService as unknown as ConfigService,
    );
    (sgMail.send as jest.Mock).mockResolvedValue([{} as never, {}]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads api key on module init', () => {
    sut.onModuleInit();
    expect(configService.get).toHaveBeenCalledWith(
      'notification.email.sendgrid.apiKey',
      '',
    );
  });

  it('sends email with fallback "from" from config', async () => {
    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).resolves.toBeUndefined();

    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'user@test.dev',
      from: 'noreply@test.dev',
      subject: 'Subject',
      html: '<p>Body</p>',
    });
  });

  it('sends email with explicit "from" from options', async () => {
    await sut.send({
      to: 'user@test.dev',
      from: 'custom@test.dev',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'custom@test.dev',
      }),
    );
  });

  it('throws NotificationError when sendgrid fails', async () => {
    (sgMail.send as jest.Mock).mockRejectedValueOnce(
      new Error('sendgrid error'),
    );

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toMatchObject({ code: NotificationErrorCode.EMAIL_SEND_FAILED });
  });
});
