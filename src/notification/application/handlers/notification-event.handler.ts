import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AuthenticationEventSchemas,
  type EventBusMessage,
  type UserRegisteredPayload,
  type UserPasswordResetRequestedPayload,
  type UserPasswordChangedPayload,
  type UserPasswordResetCompletedPayload,
} from 'src/common/event-manager';
import { SendWelcomeEmailUseCase } from '../use-cases/send-welcome-email.use-case';
import { SendPasswordResetEmailUseCase } from '../use-cases/send-password-reset-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../use-cases/send-password-changed-email.use-case';
import { SendPasswordResetCompletedEmailUseCase } from '../use-cases/send-password-reset-completed-email.use-case';
import { type RequestContext } from 'src/common/auth';

@Injectable()
export class NotificationEventHandler {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    private readonly sendWelcomeEmailUseCase: SendWelcomeEmailUseCase,
    private readonly sendPasswordResetEmailUseCase: SendPasswordResetEmailUseCase,
    private readonly sendPasswordChangedEmailUseCase: SendPasswordChangedEmailUseCase,
    private readonly sendPasswordResetCompletedEmailUseCase: SendPasswordResetCompletedEmailUseCase,
  ) {}

  @OnEvent(AuthenticationEventSchemas.USER_REGISTERED.eventName)
  async handleUserRegistered(
    message: EventBusMessage<UserRegisteredPayload>,
  ): Promise<void> {
    this.logger.debug(`Handling USER_REGISTERED for ${message.payload.email}`);
    await this.sendWelcomeEmailUseCase.execute({
      email: message.payload.email,
      firstName: message.payload.firstName,
      verificationToken: message.payload.verificationToken,
    });
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED.eventName)
  async handlePasswordResetRequested(
    message: EventBusMessage<UserPasswordResetRequestedPayload>,
  ): Promise<void> {
    this.logger.debug(
      `Handling USER_PASSWORD_RESET_REQUESTED for ${message.payload.email}`,
    );
    await this.sendPasswordResetEmailUseCase.execute({
      email: message.payload.email,
      rawToken: message.payload.rawToken,
    });
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_CHANGED.eventName)
  async handlePasswordChanged(
    message: EventBusMessage<UserPasswordChangedPayload>,
  ): Promise<void> {
    this.logger.debug(
      `Handling USER_PASSWORD_CHANGED for ${message.payload.authId}`,
    );
    const ctx = message.metadata.metadata as RequestContext | undefined;
    await this.sendPasswordChangedEmailUseCase.execute({
      email: message.payload.email,
      ipAddress: ctx?.ipAddress ?? undefined,
      changedAt: new Date(message.metadata.timestamp).toUTCString(),
    });
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_RESET_COMPLETED.eventName)
  async handlePasswordResetCompleted(
    message: EventBusMessage<UserPasswordResetCompletedPayload>,
  ): Promise<void> {
    this.logger.debug(
      `Handling USER_PASSWORD_RESET_COMPLETED for ${message.payload.authId}`,
    );
    const ctx = message.metadata.metadata as RequestContext | undefined;
    await this.sendPasswordResetCompletedEmailUseCase.execute({
      email: message.payload.email,
      ipAddress: ctx?.ipAddress ?? undefined,
      completedAt: new Date(message.metadata.timestamp).toUTCString(),
    });
  }
}
