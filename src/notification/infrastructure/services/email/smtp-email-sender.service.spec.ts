import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpEmailSenderService } from './smtp-email-sender.service';
import { NotificationErrorCode } from '../../../domain/errors/notification.error-codes';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SmtpEmailSenderService', () => {
  let sut: SmtpEmailSenderService;
  let configService: { get: jest.Mock };
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue(undefined);

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          'notification.email.smtp.host': 'smtp.test.dev',
          'notification.email.smtp.port': 2525,
          'notification.email.smtp.secure': true,
          'notification.email.smtp.user': 'smtp-user',
          'notification.email.smtp.pass': 'smtp-pass',
          'notification.email.from': 'noreply@test.dev',
        };
        return values[key] ?? defaultValue;
      }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as nodemailer.Transporter);

    sut = new SmtpEmailSenderService(configService as unknown as ConfigService);
    sut.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates transporter with smtp config on module init', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.dev',
      port: 2525,
      secure: true,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-pass',
      },
    });
  });

  it('sends email with fallback "from" from config', async () => {
    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).resolves.toBeUndefined();

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'noreply@test.dev',
      to: 'user@test.dev',
      subject: 'Subject',
      html: '<p>Body</p>',
    });
  });

  it('uses explicit "from" from options', async () => {
    await sut.send({
      to: 'user@test.dev',
      from: 'custom@test.dev',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'custom@test.dev',
      }),
    );
  });

  it('throws NotificationError when smtp send fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('smtp error'));

    await expect(
      sut.send({
        to: 'user@test.dev',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toMatchObject({ code: NotificationErrorCode.EMAIL_SEND_FAILED });
  });
});
