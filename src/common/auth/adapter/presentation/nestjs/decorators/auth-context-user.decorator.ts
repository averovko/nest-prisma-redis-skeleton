import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { type User } from '../../../../domain';
import { AuthAppError, extractUser } from '../../../../application';
import { mapAuthAppError, rethrowAsAppError } from '../auth-error.mapper';
import { type RequestWithAuthCtx } from '../types';

export const AuthContextUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | User[keyof User] => {
    const { authCtx } = ctx.switchToHttp().getRequest<RequestWithAuthCtx>();

    if (!authCtx) {
      throw mapAuthAppError(new AuthAppError('invalid-token'));
    }

    try {
      const user = extractUser(authCtx);
      if (data && typeof data === 'string') {
        return user[data as keyof User];
      }
      return user;
    } catch (err) {
      rethrowAsAppError(err);
    }
  },
);
