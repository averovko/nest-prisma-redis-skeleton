import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthCtx } from '../../../../domain';
import { AuthAppError } from '../../../../application';
import { mapAuthAppError } from '../auth-error.mapper';
import { type RequestWithAuthCtx } from '../types';

export const AuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthCtx => {
    const { authCtx } = ctx.switchToHttp().getRequest<RequestWithAuthCtx>();

    if (!authCtx) {
      throw mapAuthAppError(new AuthAppError('invalid-token'));
    }

    return authCtx;
  },
);
