import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '../../../domain';
import { AuthAppError, assertRoles } from '../../../application';
import { ROLES_KEY } from './decorators/require-any-roles.decorator';
import { mapAuthAppError, rethrowAsAppError } from './auth-error.mapper';
import { type RequestWithAuthCtx } from './types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { authCtx } = context.switchToHttp().getRequest<RequestWithAuthCtx>();

    if (!authCtx) {
      throw mapAuthAppError(new AuthAppError('invalid-token'));
    }

    try {
      assertRoles(authCtx, requiredRoles);
      return true;
    } catch (err) {
      rethrowAsAppError(err);
    }
  }
}
