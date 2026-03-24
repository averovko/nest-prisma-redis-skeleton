import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthCtx } from '../../../../domain';
import { type RequestWithAuthCtx } from '../types';

export const OptionalAuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthCtx | undefined => {
    const { authCtx } = ctx.switchToHttp().getRequest<RequestWithAuthCtx>();
    return authCtx;
  },
);
