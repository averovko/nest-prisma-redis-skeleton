import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailSenderPort, SendEmailOptions } from '../../../domain/ports/email-sender.port';
import { NotificationErrorFactory } from '../../../domain/errors/notification.error-factory';

@Injectable()
export class SmtpEmailSenderService implements EmailSenderPort, OnModuleInit {
  private readonly logger = new Logger(SmtpEmailSenderService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('notification.email.smtp.host', 'localhost'),
      port: this.configService.get<number>('notification.email.smtp.port', 587),
      secure: this.configService.get<boolean>('notification.email.smtp.secure', false),
      auth: {
        user: this.configService.get<string>('notification.email.smtp.user', ''),
        pass: this.configService.get<string>('notification.email.smtp.pass', ''),
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    const from = options.from ?? this.configService.get<string>('notification.email.from', 'noreply@example.com');
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent via SMTP to ${options.to}`);
    } catch (error) {
      this.logger.error(`SMTP send failed for ${options.to}`, error);
      throw NotificationErrorFactory.emailSendFailed(error);
    }
  }
}
