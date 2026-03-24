import { Request } from 'express';
import { AuthCtx } from '../../../domain';

export type RequestWithAuthCtx = Request & { authCtx?: AuthCtx };
