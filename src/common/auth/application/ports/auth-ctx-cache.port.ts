import { AuthCtx } from '../../domain';

export const AUTH_CTX_CACHE_PORT = Symbol('AuthCtxCachePort');

export interface AuthCtxCachePort {
  getByToken(token: string): Promise<AuthCtx | null>;
  setByToken(token: string, authCtx: AuthCtx, ttlMs: number): Promise<void>;
}
