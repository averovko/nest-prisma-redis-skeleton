import { BaseEvent, AuthenticationEventSchemas } from 'src/common/event-manager';
import { EventMetadata } from 'src/common/event-manager';
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
      userId: credentials.authId,
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
      userId: credentials.authId,
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
      userId: credentials.authId,
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
    userId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_CHANGED, params);
    this.eventPayload = {
      userId: userId,
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
      userId: credentials.authId,
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
      userId: credentials.authId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { AuthenticationEventSchemas as USER_EVENTS } from 'src/common/event-manager';
