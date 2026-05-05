import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from 'src/common/configuration/config.module';
import { EMAIL_SENDER_PORT } from './domain/ports/email-sender.port';
import { SMS_SENDER_PORT } from './domain/ports/sms-sender.port';
import { TEMPLATE_RENDERER_PORT } from './domain/ports/template-renderer.port';
import { ConsoleEmailSenderService } from './infrastructure/services/email/console-email-sender.service';
import { SmtpEmailSenderService } from './infrastructure/services/email/smtp-email-sender.service';
import { SendGridEmailSenderService } from './infrastructure/services/email/sendgrid-email-sender.service';
import { UniSenderEmailSenderService } from './infrastructure/services/email/unisender-email-sender.service';
import { ConsoleSmsSenderService } from './infrastructure/services/sms/console-sms-sender.service';
import { UniSenderSmsSenderService } from './infrastructure/services/sms/unisender-sms-sender.service';
import { HandlebarsTemplateRendererService } from './infrastructure/services/template/handlebars-template-renderer.service';
import { SendWelcomeEmailUseCase } from './application/use-cases/send-welcome-email.use-case';
import { SendPasswordResetEmailUseCase } from './application/use-cases/send-password-reset-email.use-case';
import { SendPasswordChangedEmailUseCase } from './application/use-cases/send-password-changed-email.use-case';
import { SendPasswordResetCompletedEmailUseCase } from './application/use-cases/send-password-reset-completed-email.use-case';
import { NotificationEventHandler } from './application/handlers/notification-event.handler';

const logger = new Logger('NotificationModule');

@Module({
  imports: [AppConfigModule],
  providers: [
    ConsoleEmailSenderService,
    SmtpEmailSenderService,
    SendGridEmailSenderService,
    UniSenderEmailSenderService,
    ConsoleSmsSenderService,
    UniSenderSmsSenderService,
    {
      provide: EMAIL_SENDER_PORT,
      useFactory: (
        config: ConfigService,
        smtp: SmtpEmailSenderService,
        sendgrid: SendGridEmailSenderService,
        unisender: UniSenderEmailSenderService,
        consoleSender: ConsoleEmailSenderService,
      ) => {
        const provider = config.get<string>(
          'notification.email.provider',
          'console',
        );
        switch (provider) {
          case 'smtp':
            logger.log('Using SMTP email sender');
            return smtp;
          case 'sendgrid':
            logger.log('Using SendGrid email sender');
            return sendgrid;
          case 'unisender':
            logger.log('Using UniSender email sender');
            return unisender;
          case 'console':
            logger.log('Using console email sender');
            return consoleSender;
          default:
            logger.log(
              `Unknown email provider "${provider}", falling back to console`,
            );
            return consoleSender;
        }
      },
      inject: [
        ConfigService,
        SmtpEmailSenderService,
        SendGridEmailSenderService,
        UniSenderEmailSenderService,
        ConsoleEmailSenderService,
      ],
    },
    {
      provide: SMS_SENDER_PORT,
      useFactory: (
        config: ConfigService,
        unisender: UniSenderSmsSenderService,
        consoleSender: ConsoleSmsSenderService,
      ) => {
        const provider = config.get<string>(
          'notification.sms.provider',
          'console',
        );
        switch (provider) {
          case 'unisender':
            logger.log('Using UniSender SMS sender');
            return unisender;
          case 'console':
            logger.log('Using console SMS sender');
            return consoleSender;
          default:
            logger.log(
              `Unknown SMS provider "${provider}", falling back to console`,
            );
            return consoleSender;
        }
      },
      inject: [
        ConfigService,
        UniSenderSmsSenderService,
        ConsoleSmsSenderService,
      ],
    },
    {
      provide: TEMPLATE_RENDERER_PORT,
      useClass: HandlebarsTemplateRendererService,
    },
    SendWelcomeEmailUseCase,
    SendPasswordResetEmailUseCase,
    SendPasswordChangedEmailUseCase,
    SendPasswordResetCompletedEmailUseCase,
    NotificationEventHandler,
  ],
})
export class NotificationModule {}
