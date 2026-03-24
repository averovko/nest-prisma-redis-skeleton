import { ConfigService } from '@nestjs/config';

import { ConfigExpectedApiKeyAdapter } from './config-expected-api-key.adapter';

function buildAdapter(
  configValues: Record<string, unknown>,
): ConfigExpectedApiKeyAdapter {
  const configService = {
    get: jest.fn(<T>(key: string, defaultValue: T): T => {
      return key in configValues ? (configValues[key] as T) : defaultValue;
    }),
  } as unknown as ConfigService;
  return new ConfigExpectedApiKeyAdapter(configService);
}

describe('ConfigExpectedApiKeyAdapter', () => {
  describe('getExpectedApiKey', () => {
    it('returns configured api key', () => {
      const adapter = buildAdapter({
        'security.metrics.apiKey': 'super-secret',
      });

      expect(adapter.getExpectedApiKey()).toBe('super-secret');
    });

    it('returns empty string as default when not configured', () => {
      const adapter = buildAdapter({});

      expect(adapter.getExpectedApiKey()).toBe('');
    });
  });
});
