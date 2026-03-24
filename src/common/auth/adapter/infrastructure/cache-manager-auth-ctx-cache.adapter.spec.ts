import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import type { Cache } from 'cache-manager';

import { AgentType, AuthCtx } from '../../domain';
import { CacheManagerAuthCtxCacheAdapter } from './cache-manager-auth-ctx-cache.adapter';

function buildAdapter(
  cacheManager: jest.Mocked<Cache>,
): CacheManagerAuthCtxCacheAdapter {
  return new (CacheManagerAuthCtxCacheAdapter as any)(cacheManager);
}

const mockCacheManager: jest.Mocked<Cache> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  store: {} as any,
} as unknown as jest.Mocked<Cache>;

const jwtToken = 'header.payload.signature123';

describe('CacheManagerAuthCtxCacheAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByToken', () => {
    it('returns null when cache miss (null)', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeNull();
    });

    it('returns null when cache miss (undefined)', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeNull();
    });

    it('returns null when cached value is not an object', async () => {
      mockCacheManager.get.mockResolvedValue('invalid-string');
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeNull();
    });

    it('returns null when cached value has invalid agentType', async () => {
      mockCacheManager.get.mockResolvedValue({ agentType: 'unknown' });
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeNull();
    });

    it('returns AuthCtx when cached value is a valid person snapshot', async () => {
      const original = AuthCtx.forPerson(
        { authId: 'a-1', email: 'a@b.com' },
        undefined,
        9999,
      );
      mockCacheManager.get.mockResolvedValue(original.toSnapshot());
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeInstanceOf(AuthCtx);
      expect(result?.isPerson()).toBe(true);
      expect(result?.getPerson()?.authId).toBe('a-1');
    });

    it('returns AuthCtx when cached value is a valid service snapshot', async () => {
      const original = AuthCtx.forService({ id: 'svc-1' }, 5000);
      mockCacheManager.get.mockResolvedValue(original.toSnapshot());
      const adapter = buildAdapter(mockCacheManager);

      const result = await adapter.getByToken(jwtToken);

      expect(result).toBeInstanceOf(AuthCtx);
      expect(result?.isService()).toBe(true);
      expect(result?.getService()?.id).toBe('svc-1');
    });

    it('uses the JWT signature (3rd segment) as cache key', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const adapter = buildAdapter(mockCacheManager);

      await adapter.getByToken(jwtToken);

      expect(mockCacheManager.get).toHaveBeenCalledWith('authCtx:signature123');
    });

    it('uses the full token as cache key when token has no dots', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const adapter = buildAdapter(mockCacheManager);

      await adapter.getByToken('opaque-token');

      expect(mockCacheManager.get).toHaveBeenCalledWith('authCtx:opaque-token');
    });
  });

  describe('setByToken', () => {
    it('stores the snapshot in cache with the correct key and TTL', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      const authCtx = AuthCtx.forService({ id: 'svc-2' });
      const adapter = buildAdapter(mockCacheManager);

      await adapter.setByToken(jwtToken, authCtx, 60_000);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'authCtx:signature123',
        expect.objectContaining({ agentType: AgentType.service }),
        60_000,
      );
    });
  });

  describe('NestJS DI wiring', () => {
    it('resolves via Test.createTestingModule', async () => {
      const module = await Test.createTestingModule({
        providers: [
          CacheManagerAuthCtxCacheAdapter,
          { provide: CACHE_MANAGER, useValue: mockCacheManager },
        ],
      }).compile();

      const adapter = module.get(CacheManagerAuthCtxCacheAdapter);
      expect(adapter).toBeInstanceOf(CacheManagerAuthCtxCacheAdapter);
    });
  });
});
