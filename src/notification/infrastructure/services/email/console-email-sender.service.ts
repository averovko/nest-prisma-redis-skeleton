import { Injectable, Logger } from '@nestjs/common';
import {
  EmailSenderPort,
  SendEmailOptions,
} from '../../../domain/ports/email-sender.port';

@Injectable()
export class ConsoleEmailSenderService implements EmailSenderPort {
  private readonly logger = new Logger(ConsoleEmailSenderService.name);

  async send(options: SendEmailOptions): Promise<void> {
    this.logger.log(
      `[EMAIL] To: ${options.to} | Subject: ${options.subject}\n` +
        `--- HTML BODY ---\n` +
        `${options.html}...`,
    );
  }
}
