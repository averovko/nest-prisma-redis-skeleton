import { BaseEvent } from '../../../common/event-manager/entities/events/base.event';
import { EventMetadata } from '../../../common/event-manager/entities/events/event.interface';
import { AuthenticationEventSchemas } from '../../../common/event-manager/entities/events/schemas';
import { Credentials } from '../entities/credentials.entity';

export class UserRegisteredEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_REGISTERED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_REGISTERED.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_REGISTERED, params);
    this.eventPayload = {
      // userId: credential.id,
      authId: credentials.authId,
      email: credentials.email,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserLoggedInEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_LOGGED_IN.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_LOGGED_IN.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_LOGGED_IN, params);
    this.eventPayload = {
      authId: credentials.authId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserLoggedOutEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_LOGGED_OUT.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_LOGGED_OUT.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_LOGGED_OUT, params);
    this.eventPayload = {
      authId: credentials.authId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserPasswordChangedEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_PASSWORD_CHANGED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_PASSWORD_CHANGED.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_CHANGED, params);
    this.eventPayload = {
      authId: credentials.authId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserPasswordResetRequestedEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED.schema;

  constructor(
    credentials: Credentials,
    public readonly rawToken: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED, params);
    this.eventPayload = {
      authId: credentials.authId,
      email: credentials.email,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserPasswordResetCompletedEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_PASSWORD_RESET_COMPLETED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_PASSWORD_RESET_COMPLETED.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_RESET_COMPLETED, params);
    this.eventPayload = {
      authId: credentials.authId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { AuthenticationEventSchemas as USER_EVENTS } from '../../../common/event-manager/entities/events/schemas';
