import { Cache } from 'cache-manager';
import { AppError, createCommonError } from 'src/common/errors';

import { AuthCtx, shouldCache } from '../../domain/entities/auth-ctx.model';
import { AuthCtxRepoPort } from '../../ports/auth-ctx-repo.port';
import { Logger } from '@nestjs/common';

export interface AuthServiceConfig {
  readonly cacheDefaultTtlMs: number;
  readonly cacheMaxTtlMs: number;
}

export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  private readonly cacheManager: Cache;
  private readonly authCtxRepo: AuthCtxRepoPort;
  private readonly config: AuthServiceConfig;

  constructor(
    cacheManager: Cache,
    authCtxRepo: AuthCtxRepoPort,
    config: AuthServiceConfig,
  ) {
    this.cacheManager = cacheManager;
    this.authCtxRepo = authCtxRepo;
    this.config = config;
  }

  async canActivate(request: any): Promise<boolean> {
    const authCtxId = this.authCtxRepo.getAuthCtxId(request);

    const authCtxKey = `authCtx:${authCtxId}`;

    try {
      // check if there is the cache data for this token
      const cachedAuthCtx = await this.cacheManager.get(authCtxKey);

      if (cachedAuthCtx) {
        request.authCtx = AuthCtx.fromJSObject(cachedAuthCtx);

        return true;
      }

      this.logger.verbose(
        'auth: authService: there is no cached authCtx => read token',
      );

      const authCtx = await this.authCtxRepo.getAuthCtx(request);

      if (shouldCache(authCtx)) {
        let ttl = this.config.cacheDefaultTtlMs;

        const expireAt = authCtx.getExpireAt();
        if (expireAt && !Number.isNaN(expireAt)) {
          ttl = expireAt * 1000 - Date.now();
        }

        ttl = Math.max(0, Math.min(this.config.cacheMaxTtlMs, ttl));

        if (ttl > 0) {
          await this.cacheManager.set(authCtxKey, authCtx, ttl);
        }
      }

      request.authCtx = authCtx;

      return true;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      this.logger.error(`auth: authService: ${err.message}`);

      throw createCommonError('server.error');
    }
  }
}
