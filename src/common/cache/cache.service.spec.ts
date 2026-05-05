import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  const mockRedisService = {
    getOrThrow: jest.fn().mockReturnValue(mockRedis),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(8),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CacheService(
      mockRedisService as any,
      mockConfigService as any,
    );
  });

  describe('get()', () => {
    it('returns parsed JSON value when key exists', async () => {
      const stored = { id: 1, name: 'Alice' };
      mockRedis.get.mockResolvedValue(JSON.stringify(stored));

      const result = await service.get<typeof stored>('my:key');

      expect(result).toEqual(stored);
      expect(mockRedis.get).toHaveBeenCalledWith('my:key');
    });

    it('returns null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('missing:key');

      expect(result).toBeNull();
    });

    it('returns null and does not throw on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await service.get('key');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('serializes value and calls setex with explicit ttl', async () => {
      const value = { id: 42 };
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('my:key', value, 60);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'my:key',
        60,
        JSON.stringify(value),
      );
    });

    it('uses defaultTtl (8) when no ttl is provided', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('my:key', { data: true });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'my:key',
        8,
        expect.any(String),
      );
    });

    it('silently swallows Redis errors without throwing', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('key', {})).resolves.toBeUndefined();
    });
  });

  describe('del()', () => {
    it('calls redis.del with the provided key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del('my:key');

      expect(mockRedis.del).toHaveBeenCalledWith('my:key');
    });

    it('silently swallows Redis errors without throwing', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('constructor', () => {
    it('reads defaultTtl from config service', () => {
      const configService = { get: jest.fn().mockReturnValue(30) };
      const svc = new CacheService(
        mockRedisService as any,
        configService as any,
      );

      configService.get.mockReturnValue(30);
      mockRedis.setex.mockResolvedValue('OK');

      svc.set('key', 'val');

      expect(configService.get).toHaveBeenCalledWith('cache.ttl', 8);
    });
  });
});
