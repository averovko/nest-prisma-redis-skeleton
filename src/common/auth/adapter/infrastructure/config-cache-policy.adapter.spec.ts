import { ConfigService } from '@nestjs/config';

import { ConfigCachePolicyAdapter } from './config-cache-policy.adapter';

function buildAdapter(
  configValues: Record<string, unknown>,
): ConfigCachePolicyAdapter {
  const configService = {
    get: jest.fn(<T>(key: string, defaultValue: T): T => {
      return key in configValues ? (configValues[key] as T) : defaultValue;
    }),
  } as unknown as ConfigService;
  return new ConfigCachePolicyAdapter(configService);
}

describe('ConfigCachePolicyAdapter', () => {
  describe('getDefaultTtlMs', () => {
    it('returns configured value', () => {
      const adapter = buildAdapter({ 'auth.cacheDefaultTtlMs': 30_000 });

      expect(adapter.getDefaultTtlMs()).toBe(30_000);
    });

    it('returns 15 minutes as default when not configured', () => {
      const adapter = buildAdapter({});

      expect(adapter.getDefaultTtlMs()).toBe(15 * 60 * 1000);
    });
  });

  describe('getMaxTtlMs', () => {
    it('returns configured value', () => {
      const adapter = buildAdapter({ 'auth.cacheMaxTtlMs': 120_000 });

      expect(adapter.getMaxTtlMs()).toBe(120_000);
    });

    it('returns 1 hour as default when not configured', () => {
      const adapter = buildAdapter({});

      expect(adapter.getMaxTtlMs()).toBe(60 * 60 * 1000);
    });
  });
});
