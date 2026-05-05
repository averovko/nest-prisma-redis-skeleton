import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsSenderPort, SendSmsOptions } from '../../../domain/ports/sms-sender.port';
import { NotificationErrorFactory } from '../../../domain/errors/notification.error-factory';

interface UniSenderSmsResponse {
  result?: { sms_id?: string };
  error?: string;
}

@Injectable()
export class UniSenderSmsSenderService implements SmsSenderPort {
  private readonly logger = new Logger(UniSenderSmsSenderService.name);
  private readonly apiUrl = 'https://api.unisender.com/ru/api';

  constructor(private readonly configService: ConfigService) {}

  async send(options: SendSmsOptions): Promise<void> {
    const apiKey = this.configService.get<string>('notification.sms.unisender.apiKey', '');
    const senderName = options.from ?? this.configService.get<string>('notification.sms.unisender.senderName', 'App');

    const params = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      phone: options.to,
      sender_name: senderName,
      text: options.body,
    });

    try {
      const response = await fetch(`${this.apiUrl}/sendSms?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`UniSender SMS API responded with status ${response.status}`);
      }

      const data = (await response.json()) as UniSenderSmsResponse;

      if (data.error) {
        throw new Error(`UniSender SMS API error: ${data.error}`);
      }

      this.logger.log(`SMS sent via UniSender to ${options.to}`);
    } catch (error) {
      this.logger.error(`UniSender SMS send failed for ${options.to}`, error);
      throw NotificationErrorFactory.smsSendFailed(error);
    }
  }
}
