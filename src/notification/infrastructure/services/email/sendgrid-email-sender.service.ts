import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { EmailSenderPort, SendEmailOptions } from '../../../domain/ports/email-sender.port';
import { NotificationErrorFactory } from '../../../domain/errors/notification.error-factory';

@Injectable()
export class SendGridEmailSenderService implements EmailSenderPort, OnModuleInit {
  private readonly logger = new Logger(SendGridEmailSenderService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.configService.get<string>('notification.email.sendgrid.apiKey', '');
    // sgMail.setApiKey(apiKey);
    // TODO: Solve this
  }

  async send(options: SendEmailOptions): Promise<void> {
    const from = options.from ?? this.configService.get<string>('notification.email.from', 'noreply@example.com');
    try {
      await sgMail.send({
        to: options.to,
        from,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent via SendGrid to ${options.to}`);
    } catch (error) {
      this.logger.error(`SendGrid send failed for ${options.to}`, error);
      throw NotificationErrorFactory.emailSendFailed(error);
    }
  }
}
