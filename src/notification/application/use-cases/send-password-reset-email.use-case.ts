import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_SENDER_PORT,
  type EmailSenderPort,
} from '../../domain/ports/email-sender.port';
import {
  TEMPLATE_RENDERER_PORT,
  type TemplateRendererPort,
} from '../../domain/ports/template-renderer.port';
import { NotificationTemplate } from '../../domain/entities/notification-template.enum';
import { type SendPasswordResetEmailInput } from '../dto/send-email.input';

@Injectable()
export class SendPasswordResetEmailUseCase {
  private readonly logger = new Logger(SendPasswordResetEmailUseCase.name);

  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    @Inject(TEMPLATE_RENDERER_PORT)
    private readonly templateRenderer: TemplateRendererPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: SendPasswordResetEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.warn(
        'SendPasswordResetEmailUseCase: email is missing, skipping',
      );
      return;
    }

    try {
      const appName = this.configService.get<string>(
        'notification.appName',
        'App',
      );
      const frontendUrl = this.configService.get<string>(
        'notification.frontendUrl',
        'https://example.com',
      );
      const appDomain = new URL(frontendUrl).hostname;
      const resetLink = `${frontendUrl}/reset-password?token=${input.rawToken}`;

      const html = await this.templateRenderer.render(
        NotificationTemplate.PASSWORD_RESET,
        {
          appName,
          appDomain,
          email: input.email,
          resetLink,
          year: new Date().getFullYear(),
        },
      );

      await this.emailSender.send({
        to: input.email,
        subject: `Reset your ${appName} password`,
        html,
      });

      this.logger.log(`Password reset email sent to ${input.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${input.email}`,
        error,
      );
    }
  }
}
