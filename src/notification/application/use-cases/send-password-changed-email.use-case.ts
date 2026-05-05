import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT, type TemplateRendererPort } from '../../domain/ports/template-renderer.port';
import { NotificationTemplate } from '../../domain/entities/notification-template.enum';
import { type SendPasswordChangedEmailInput } from '../dto/send-email.input';

@Injectable()
export class SendPasswordChangedEmailUseCase {
  private readonly logger = new Logger(SendPasswordChangedEmailUseCase.name);

  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    @Inject(TEMPLATE_RENDERER_PORT)
    private readonly templateRenderer: TemplateRendererPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: SendPasswordChangedEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.warn('SendPasswordChangedEmailUseCase: email is missing, skipping');
      return;
    }

    try {
      const appName = this.configService.get<string>('notification.appName', 'App');
      const frontendUrl = this.configService.get<string>('notification.frontendUrl', 'https://example.com');
      const appDomain = new URL(frontendUrl).hostname;

      const html = await this.templateRenderer.render(NotificationTemplate.PASSWORD_CHANGED, {
        appName,
        appDomain,
        email: input.email,
        changedAt: input.changedAt ?? new Date().toUTCString(),
        ipAddress: input.ipAddress ?? 'Unknown',
        year: new Date().getFullYear(),
      });

      await this.emailSender.send({
        to: input.email,
        subject: `Your ${appName} password was changed`,
        html,
      });

      this.logger.log(`Password changed email sent to ${input.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${input.email}`, error);
    }
  }
}
