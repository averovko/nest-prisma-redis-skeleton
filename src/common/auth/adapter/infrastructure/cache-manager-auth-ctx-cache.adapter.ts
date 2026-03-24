import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

import { AgentType, AuthCtx, type AuthCtxSnapshot } from '../../domain';
import { type AuthCtxCachePort } from '../../application';

@Injectable()
export class CacheManagerAuthCtxCacheAdapter implements AuthCtxCachePort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getByToken(token: string): Promise<AuthCtx | null> {
    const raw = await this.cacheManager.get<unknown>(this.buildKey(token));
    if (!raw || !this.isAuthCtxSnapshot(raw)) {
      return null;
    }
    return AuthCtx.fromSnapshot(raw);
  }

  async setByToken(
    token: string,
    authCtx: AuthCtx,
    ttlMs: number,
  ): Promise<void> {
    await this.cacheManager.set(
      this.buildKey(token),
      authCtx.toSnapshot(),
      ttlMs,
    );
  }

  private buildKey(token: string): string {
    const signature = token.split('.')[2];
    return `authCtx:${signature ?? token}`;
  }

  private isAuthCtxSnapshot(value: unknown): value is AuthCtxSnapshot {
    if (value === null || typeof value !== 'object') {
      return false;
    }
    const record = value as Record<string, unknown>;
    return (
      record.agentType === AgentType.person ||
      record.agentType === AgentType.service
    );
  }
}
