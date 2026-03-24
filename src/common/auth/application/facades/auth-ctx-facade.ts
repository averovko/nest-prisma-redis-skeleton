import {
  AuthCtx,
  type User,
  type Person,
  AuthDomainError,
  type Role,
} from '../../domain';
import { AuthAppError } from '../errors/auth-app-error';

export function extractUser(authCtx: AuthCtx): User {
  try {
    return authCtx.requireUser();
  } catch (err) {
    if (err instanceof AuthDomainError && err.code === 'require-user') {
      throw new AuthAppError('require-user');
    }
    throw new AuthAppError('server-error', undefined, { cause: err });
  }
}

export function extractPerson(authCtx: AuthCtx): Person {
  try {
    return authCtx.requirePerson();
  } catch (err) {
    if (err instanceof AuthDomainError && err.code === 'require-person') {
      throw new AuthAppError('require-person');
    }
    throw new AuthAppError('server-error', undefined, { cause: err });
  }
}

export function assertRoles(authCtx: AuthCtx, roles: Role[]): void {
  try {
    authCtx.assertHasAnyRole(roles);
  } catch (err) {
    if (err instanceof AuthDomainError) {
      throw new AuthAppError(
        err.code === 'no-privilege' ? 'no-privilege' : 'require-user',
        err.params,
      );
    }
    throw new AuthAppError('server-error', undefined, { cause: err });
  }
}
