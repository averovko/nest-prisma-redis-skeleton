import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailSenderPort,
  SendEmailOptions,
} from '../../../domain/ports/email-sender.port';
import { NotificationErrorFactory } from '../../../domain/errors/notification.error-factory';

interface UniSenderEmailResponse {
  result?: {
    email_id?: string;
    emails?: Array<{ email: string; status: string }>;
  };
  error?: string;
}

@Injectable()
export class UniSenderEmailSenderService implements EmailSenderPort {
  private readonly logger = new Logger(UniSenderEmailSenderService.name);
  private readonly apiUrl = 'https://api.unisender.com/ru/api';

  constructor(private readonly configService: ConfigService) {}

  async send(options: SendEmailOptions): Promise<void> {
    const apiKey = this.configService.get<string>(
      'notification.email.unisender.apiKey',
      '',
    );
    const from =
      options.from ??
      this.configService.get<string>(
        'notification.email.from',
        'noreply@example.com',
      );

    const params = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      email: options.to,
      sender_name: this.configService.get<string>(
        'notification.appName',
        'App',
      ),
      sender_email: from,
      subject: options.subject,
      body: options.html,
      list_id: '1',
    });

    try {
      const response = await fetch(
        `${this.apiUrl}/sendEmail?${params.toString()}`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(
          `UniSender API responded with status ${response.status}`,
        );
      }

      const data = (await response.json()) as UniSenderEmailResponse;

      if (data.error) {
        throw new Error(`UniSender API error: ${data.error}`);
      }

      this.logger.log(`Email sent via UniSender to ${options.to}`);
    } catch (error) {
      this.logger.error(`UniSender email send failed for ${options.to}`, error);
      throw NotificationErrorFactory.emailSendFailed(error);
    }
  }
}
