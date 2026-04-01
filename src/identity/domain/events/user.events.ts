import { BaseEvent } from '../../../common/event-manager/domain/events/base.event';
import { EventMetadata } from '../../../common/event-manager/domain/events/event.interface';
import { IdentityEventSchemas } from '../../../common/event-manager/application/schemas/identity.events';
import { User } from '../entities/user.entity';
import { Role } from 'src/common/auth';

export class UserCreatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_CREATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_CREATED.schema;

  constructor(
    user: User,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_CREATED, params);
    this.eventPayload = {
      userId: user.id,
      authId: user.authId,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      avatar: user.avatar ?? undefined,
      roles: user.roles,
      isActive: user.isActive,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserUpdatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_UPDATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_UPDATED.schema;

  constructor(
    user: User,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_UPDATED, params);
    this.eventPayload = {
      userId: user.id,
      authId: user.authId,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      avatar: user.avatar ?? undefined,
      roles: user.roles,
      isActive: user.isActive,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserRoleChangedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_ROLE_CHANGED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_ROLE_CHANGED.schema;

  constructor(
    userId: string,
    authId: string,
    roles: Role[],
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_ROLE_CHANGED, params);
    this.eventPayload = {
      userId,
      authId,
      roles,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserDeactivatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_DEACTIVATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_DEACTIVATED.schema;

  constructor(
    userId: string,
    authId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_DEACTIVATED, params);
    this.eventPayload = {
      userId,
      authId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserActivatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_ACTIVATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_ACTIVATED.schema;

  constructor(
    userId: string,
    authId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_ACTIVATED, params);
    this.eventPayload = {
      userId,
      authId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export class UserDeletedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_DELETED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_DELETED.schema;

  constructor(
    userId: string,
    authId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_DELETED, params);
    this.eventPayload = {
      userId,
      authId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { IdentityEventSchemas as USER_EVENTS } from '../../../common/event-manager/application/schemas/identity.events';
