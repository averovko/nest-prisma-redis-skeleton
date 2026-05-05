import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT, type TemplateRendererPort } from '../../domain/ports/template-renderer.port';
import { NotificationTemplate } from '../../domain/entities/notification-template.enum';
import { type SendWelcomeEmailInput } from '../dto/send-email.input';

@Injectable()
export class SendWelcomeEmailUseCase {
  private readonly logger = new Logger(SendWelcomeEmailUseCase.name);

  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    @Inject(TEMPLATE_RENDERER_PORT)
    private readonly templateRenderer: TemplateRendererPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: SendWelcomeEmailInput): Promise<void> {
    if (!input.email) {
      this.logger.warn('SendWelcomeEmailUseCase: email is missing, skipping');
      return;
    }

    try {
      const appName = this.configService.get<string>('notification.appName', 'App');
      const frontendUrl = this.configService.get<string>('notification.frontendUrl', 'https://example.com');
      const appDomain = new URL(frontendUrl).hostname;
      const verificationLink = `${frontendUrl}/verify-email?token=${input.verificationToken}`;

      const html = await this.templateRenderer.render(NotificationTemplate.WELCOME, {
        appName,
        appDomain,
        firstName: input.firstName,
        verificationLink,
        year: new Date().getFullYear(),
      });

      await this.emailSender.send({
        to: input.email,
        subject: `Welcome to ${appName} — Please verify your email`,
        html,
      });

      this.logger.log(`Welcome email sent to ${input.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${input.email}`, error);
    }
  }
}
