import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
  USER_EVENTS,
} from '../../domain/events/user.events';
import {
  UserActivatedUseCase,
  UserCreatedUseCase,
  UserDeactivatedUseCase,
  UserDeletedUseCase,
  UserLoggedInUseCase,
  UserLoggedOutUseCase,
  UserPasswordChangedUseCase,
  UserPasswordResetCompletedUseCase,
  UserPasswordResetRequestedUseCase,
  UserRegisteredUseCase,
  UserRoleChangedUseCase,
  UserUpdatedUseCase,
} from '../use-cases/user-activity';
import {
  AuthenticationEventSchemas,
  type EventBusMessage,
  type UserLoggedInPayload,
  type UserLoggedOutPayload,
  type UserPasswordChangedPayload,
  type UserPasswordResetCompletedPayload,
  type UserPasswordResetRequestedPayload,
  type UserRegisteredPayload,
} from 'src/common/event-manager';

@Injectable()
export class UserActivityHandler {
  constructor(
    private readonly userCreatedUseCase: UserCreatedUseCase,
    private readonly userUpdatedUseCase: UserUpdatedUseCase,
    private readonly userRoleChangedUseCase: UserRoleChangedUseCase,
    private readonly userActivatedUseCase: UserActivatedUseCase,
    private readonly userDeactivatedUseCase: UserDeactivatedUseCase,
    private readonly userDeletedUseCase: UserDeletedUseCase,
    private readonly userPasswordChangedUseCase: UserPasswordChangedUseCase,
    private readonly userRegisteredUseCase: UserRegisteredUseCase,
    private readonly userLoggedInUseCase: UserLoggedInUseCase,
    private readonly userLoggedOutUseCase: UserLoggedOutUseCase,
    private readonly userPasswordResetRequestedUseCase: UserPasswordResetRequestedUseCase,
    private readonly userPasswordResetCompletedUseCase: UserPasswordResetCompletedUseCase,
  ) {}

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_CHANGED.eventName)
  handleUserPasswordChanged(
    message: EventBusMessage<UserPasswordChangedPayload>,
  ) {
    return this.userPasswordChangedUseCase.execute(message);
  }

  @OnEvent(AuthenticationEventSchemas.USER_REGISTERED.eventName)
  handleUserRegistered(message: EventBusMessage<UserRegisteredPayload>) {
    return this.userRegisteredUseCase.execute(message);
  }

  @OnEvent(AuthenticationEventSchemas.USER_LOGGED_IN.eventName)
  handleUserLoggedIn(message: EventBusMessage<UserLoggedInPayload>) {
    return this.userLoggedInUseCase.execute(message);
  }

  @OnEvent(AuthenticationEventSchemas.USER_LOGGED_OUT.eventName)
  handleUserLoggedOut(message: EventBusMessage<UserLoggedOutPayload>) {
    return this.userLoggedOutUseCase.execute(message);
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED.eventName)
  handleUserPasswordResetRequested(
    message: EventBusMessage<UserPasswordResetRequestedPayload>,
  ) {
    return this.userPasswordResetRequestedUseCase.execute(message);
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_RESET_COMPLETED.eventName)
  handleUserPasswordResetCompleted(
    message: EventBusMessage<UserPasswordResetCompletedPayload>,
  ) {
    return this.userPasswordResetCompletedUseCase.execute(message);
  }

  @OnEvent(USER_EVENTS.USER_CREATED.eventName)
  handleUserCreated(event: UserCreatedEvent) {
    return this.userCreatedUseCase.execute(event);
  }

  @OnEvent(USER_EVENTS.USER_UPDATED.eventName)
  handleUserUpdated(event: UserUpdatedEvent) {
    return this.userUpdatedUseCase.execute(event);
  }

  @OnEvent(USER_EVENTS.USER_ROLE_CHANGED.eventName)
  handleUserRoleChanged(event: UserRoleChangedEvent) {
    return this.userRoleChangedUseCase.execute(event);
  }

  @OnEvent(USER_EVENTS.USER_DEACTIVATED.eventName)
  handleUserDeactivated(event: UserDeactivatedEvent) {
    return this.userDeactivatedUseCase.execute(event);
  }

  @OnEvent(USER_EVENTS.USER_ACTIVATED.eventName)
  handleUserActivated(event: UserActivatedEvent) {
    return this.userActivatedUseCase.execute(event);
  }

  @OnEvent(USER_EVENTS.USER_DELETED.eventName)
  handleUserDeleted(event: UserDeletedEvent) {
    return this.userDeletedUseCase.execute(event);
  }
}
