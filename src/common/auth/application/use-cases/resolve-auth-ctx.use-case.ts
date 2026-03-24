import { AuthCtx, type Person } from '../../domain';
import { AuthAppError } from '../errors/auth-app-error';
import type { AuthCtxCachePort } from '../ports/auth-ctx-cache.port';
import type { CachePolicyPort } from '../ports/cache-policy.port';
import type { AuthTokenPort } from '../ports/auth-token.port';
import type { UserLookupPort } from '../ports/user-lookup.port';
import type { IResolveAuthCtxUseCase } from '../ports/resolve-auth-ctx.use-case.port';

export class ResolveAuthCtxUseCase implements IResolveAuthCtxUseCase {
  constructor(
    private readonly authTokenPort: AuthTokenPort,
    private readonly userLookupPort: UserLookupPort,
    private readonly authCtxCachePort: AuthCtxCachePort,
    private readonly cachePolicyPort: CachePolicyPort,
  ) {}

  async execute(token: string): Promise<AuthCtx> {
    try {
      const cached = await this.authCtxCachePort.getByToken(token);
      if (cached) {
        return cached;
      }
      const payload = await this.authTokenPort.resolvePayload(token);
      const person: Person = {
        authId: payload.sub,
        email: payload.email,
        phone: payload.phone,
      };
      const user = await this.userLookupPort.findByAuthId(payload.sub);
      const authCtx = AuthCtx.forPerson(person, user, payload.exp);
      if (this.shouldCache(authCtx)) {
        const ttl = this.resolveTtlMs(authCtx);
        if (ttl > 0) {
          await this.authCtxCachePort.setByToken(token, authCtx, ttl);
        }
      }
      return authCtx;
    } catch (err) {
      if (err instanceof AuthAppError) throw err;
      throw new AuthAppError('server-error', undefined, { cause: err });
    }
  }

  private shouldCache(authCtx: AuthCtx): boolean {
    if (authCtx.isService()) {
      return true;
    }
    return authCtx.isPerson() && authCtx.isUser();
  }

  private resolveTtlMs(authCtx: AuthCtx): number {
    let ttl = this.cachePolicyPort.getDefaultTtlMs();
    const expireAt = authCtx.getExpireAt();
    if (expireAt && !Number.isNaN(expireAt)) {
      ttl = expireAt * 1000 - Date.now();
    }
    return Math.max(0, Math.min(this.cachePolicyPort.getMaxTtlMs(), ttl));
  }
}
