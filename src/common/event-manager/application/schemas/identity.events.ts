import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EventSchema } from '../../domain/events/event.interface';
import { Role } from 'src/common/auth';

class BaseUserEventPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class UserCreatedPayload extends BaseUserEventPayload {}

class UserUpdatedPayload extends BaseUserEventPayload {}

class UserRoleChangedPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsUUID()
  operatorId: string;
}

class UserDeactivatedPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsUUID()
  operatorId: string;
}

class UserActivatedPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsUUID()
  operatorId: string;
}

class UserDeletedPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsUUID()
  operatorId: string;
}

export const IdentityEventSchemas = {
  USER_CREATED: {
    eventName: 'identity.user.created',
    schema: new UserCreatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a new user is created',
  } as EventSchema<UserCreatedPayload>,

  USER_UPDATED: {
    eventName: 'identity.user.updated',
    schema: new UserUpdatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is updated',
  } as EventSchema<UserUpdatedPayload>,

  USER_ROLE_CHANGED: {
    eventName: 'identity.user.role.changed',
    schema: new UserRoleChangedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user role is changed',
  } as EventSchema<UserRoleChangedPayload>,

  USER_DEACTIVATED: {
    eventName: 'identity.user.deactivated',
    schema: new UserDeactivatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is deactivated',
  } as EventSchema<UserDeactivatedPayload>,

  USER_ACTIVATED: {
    eventName: 'identity.user.activated',
    schema: new UserActivatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is activated',
  } as EventSchema<UserActivatedPayload>,

  USER_DELETED: {
    eventName: 'identity.user.deleted',
    schema: new UserDeletedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is deleted',
  } as EventSchema<UserDeletedPayload>,
} as const;
