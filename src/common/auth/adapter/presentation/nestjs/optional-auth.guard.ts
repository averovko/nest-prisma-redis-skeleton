import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  RESOLVE_AUTH_CTX_USE_CASE,
  type IResolveAuthCtxUseCase,
  AuthAppError,
} from '../../../application';
import { rethrowAsAppError } from './auth-error.mapper';
import { type RequestWithAuthCtx } from './types';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(RESOLVE_AUTH_CTX_USE_CASE)
    private readonly resolveAuthCtx: IResolveAuthCtxUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthCtx>();
    const token = this.extractBearerToken(request);

    if (!token) {
      return true;
    }

    try {
      const authCtx = await this.resolveAuthCtx.execute(token);
      request.authCtx = authCtx;
    } catch (err) {
      if (err instanceof AuthAppError && err.code === 'invalid-token') {
        return true;
      }
      rethrowAsAppError(err);
    }

    return true;
  }

  private extractBearerToken(request: RequestWithAuthCtx): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
