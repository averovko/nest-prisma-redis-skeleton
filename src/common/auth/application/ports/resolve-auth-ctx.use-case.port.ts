import { AuthCtx } from '../../domain';

export const RESOLVE_AUTH_CTX_USE_CASE = Symbol('ResolveAuthCtxUseCase');

export interface IResolveAuthCtxUseCase {
  execute(token: string): Promise<AuthCtx>;
}
