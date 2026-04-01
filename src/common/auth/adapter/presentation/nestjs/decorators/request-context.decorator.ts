import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type RequestContext } from '../../../../domain';
import { type RequestWithAuthCtx } from '../types';

export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuthCtx>();
    return request.requestContext;
  },
);
