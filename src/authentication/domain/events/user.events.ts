import { BaseEvent, AuthenticationEventSchemas } from 'src/common/event-manager';
import { EventMetadata } from 'src/common/event-manager';
import { Credentials } from '../entities/credentials.entity';

export class UserRegisteredEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_REGISTERED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_REGISTERED.schema;

  constructor(
    credentials: Credentials,
    firstName: string,
    verificationToken: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_REGISTERED, params);
    this.eventPayload = {
      authId: credentials.authId,
      email: credentials.email,
      firstName,
      verificationToken,
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
    authId: string,
    email: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_CHANGED, params);
    this.eventPayload = {
      authId,
      email,
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
    rawToken: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED, params);
    this.eventPayload = {
      authId: credentials.authId,
      email: credentials.email,
      rawToken,
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
      email: credentials.email,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { AuthenticationEventSchemas as USER_EVENTS } from 'src/common/event-manager';
