import { IsEmail, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';

/**
 * Base payload for user events
 */
class BaseAuthenticationPayload {
  @IsUUID()
  authId: string;
}

/**
 * Payload for user registered event
 */
export class UserRegisteredPayload extends BaseAuthenticationPayload {
  @IsEmail()
  email: string;
}

/**
 * Payload for user logged in event
 */
export class UserLoggedInPayload extends BaseAuthenticationPayload {}

/**
 * Payload for user logged out event
 */
export class UserLoggedOutPayload extends BaseAuthenticationPayload {}

/**
 * Payload for user password changed event
 */
export class UserPasswordChangedPayload extends BaseAuthenticationPayload {}

/**
 * Payload for password reset requested event
 */
export class UserPasswordResetRequestedPayload extends BaseAuthenticationPayload {
  @IsEmail()
  email: string;
}

/**
 * Payload for password reset completed event
 */
export class UserPasswordResetCompletedPayload extends BaseAuthenticationPayload {}

/**
 * All authentication related event schemas
 */
export const AuthenticationEventSchemas = {
  USER_REGISTERED: {
    eventName: 'authentication.user.registered',
    schema: new UserRegisteredPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a new user is registered',
  } as EventSchema<UserRegisteredPayload>,

  USER_LOGGED_IN: {
    eventName: 'authentication.user.logged.in',
    schema: new UserLoggedInPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a user is logged in',
  } as EventSchema<UserLoggedInPayload>,

  USER_LOGGED_OUT: {
    eventName: 'authentication.user.logged.out',
    schema: new UserLoggedOutPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a user is logged out',
  } as EventSchema<UserLoggedOutPayload>,

  USER_PASSWORD_CHANGED: {
    eventName: 'authentication.user.password.changed',
    schema: new UserPasswordChangedPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a logged-in user changes their password',
  } as EventSchema<UserPasswordChangedPayload>,

  USER_PASSWORD_RESET_REQUESTED: {
    eventName: 'authentication.user.password.reset.requested',
    schema: new UserPasswordResetRequestedPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a password reset is initiated',
  } as EventSchema<UserPasswordResetRequestedPayload>,

  USER_PASSWORD_RESET_COMPLETED: {
    eventName: 'authentication.user.password.reset.completed',
    schema: new UserPasswordResetCompletedPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a password reset is successfully confirmed',
  } as EventSchema<UserPasswordResetCompletedPayload>,
} as const;
