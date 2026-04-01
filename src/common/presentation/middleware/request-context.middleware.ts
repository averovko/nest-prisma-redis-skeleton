import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { type RequestContext } from 'src/common/auth';
import { ParseUserAgentHelper, IPToLocationHelper } from 'src/common/helpers';

export type RequestWithContext = Request & { requestContext?: RequestContext };

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithContext, _res: Response, next: NextFunction): void {

    const userDetails = ParseUserAgentHelper(req);
    const location = IPToLocationHelper(userDetails.ipAddress);

    const requestContext: RequestContext = {
      ipAddress: userDetails.ipAddress,
      userAgent: userDetails.userAgent,
      device: userDetails.device,
      client: userDetails.client,
      os: userDetails.os,
      location,
    };

    req.requestContext = requestContext;
    next();
  }
}
