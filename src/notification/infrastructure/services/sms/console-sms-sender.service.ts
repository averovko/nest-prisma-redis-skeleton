import { Injectable, Logger } from '@nestjs/common';
import { SmsSenderPort, SendSmsOptions } from '../../../domain/ports/sms-sender.port';

@Injectable()
export class ConsoleSmsSenderService implements SmsSenderPort {
  private readonly logger = new Logger(ConsoleSmsSenderService.name);

  async send(options: SendSmsOptions): Promise<void> {
    this.logger.log(`[SMS] To: ${options.to} | Body: ${options.body}`);
  }
}
