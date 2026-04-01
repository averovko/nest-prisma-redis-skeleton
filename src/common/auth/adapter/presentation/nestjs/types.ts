import { Request } from 'express';
import { AuthCtx, type RequestContext } from '../../../domain';

export type RequestWithAuthCtx = Request & {
  authCtx?: AuthCtx;
  requestContext?: RequestContext;
};
