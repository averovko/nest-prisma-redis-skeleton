import { version } from '../../../package.json';

describe('configuration factory', () => {
  let configuration: () => Record<string, unknown>;
  const savedEnv = process.env;

  beforeEach(() => {
    process.env = { ...savedEnv };
    jest.resetModules();
    configuration = require('./configuration').default;
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it('returns app.version from package.json', () => {
    const cfg = configuration() as any;

    expect(cfg.app.version).toBe(version);
  });

  it('defaults nodeEnv to development', () => {
    delete process.env.NODE_ENV;
    const cfg = configuration() as any;

    expect(cfg.nodeEnv).toBe('development');
  });

  it('reads NODE_ENV from environment', () => {
    process.env.NODE_ENV = 'production';
    const cfg = configuration() as any;

    expect(cfg.nodeEnv).toBe('production');
  });

  it('defaults app.port to 8000', () => {
    delete process.env.APP_PORT;
    const cfg = configuration() as any;

    expect(cfg.app.port).toBe(8000);
  });

  it('parses APP_PORT as integer', () => {
    process.env.APP_PORT = '3000';
    const cfg = configuration() as any;

    expect(cfg.app.port).toBe(3000);
  });

  it('defaults app.name to App', () => {
    delete process.env.APP_NAME;
    const cfg = configuration() as any;

    expect(cfg.app.name).toBe('App');
  });

  it('reads APP_NAME from environment', () => {
    process.env.APP_NAME = 'MyService';
    const cfg = configuration() as any;

    expect(cfg.app.name).toBe('MyService');
  });

  it('defaults app.url to https://example.com', () => {
    delete process.env.APP_URL;
    const cfg = configuration() as any;

    expect(cfg.app.url).toBe('https://example.com');
  });

  it('defaults logLevel to info', () => {
    delete process.env.LOG_LEVEL;
    const cfg = configuration() as any;

    expect(cfg.logLevel).toBe('info');
  });

  it('reads LOG_LEVEL from environment', () => {
    process.env.LOG_LEVEL = 'debug';
    const cfg = configuration() as any;

    expect(cfg.logLevel).toBe('debug');
  });

  it('sets shouldVerifyToken=true when VERIFY_TOKEN=true', () => {
    process.env.VERIFY_TOKEN = 'true';
    const cfg = configuration() as any;

    expect(cfg.security.shouldVerifyToken).toBe(true);
  });

  it('sets shouldVerifyToken=false when VERIFY_TOKEN is not true', () => {
    process.env.VERIFY_TOKEN = 'false';
    const cfg = configuration() as any;

    expect(cfg.security.shouldVerifyToken).toBe(false);
  });

  it('sets shouldVerifyToken=false when VERIFY_TOKEN is undefined', () => {
    delete process.env.VERIFY_TOKEN;
    const cfg = configuration() as any;

    expect(cfg.security.shouldVerifyToken).toBe(false);
  });

  it('defaults bcryptSaltRounds to 12', () => {
    delete process.env.BCRYPT_SALT_ROUNDS;
    const cfg = configuration() as any;

    expect(cfg.security.bcryptSaltRounds).toBe(12);
  });

  it('parses BCRYPT_SALT_ROUNDS as integer', () => {
    process.env.BCRYPT_SALT_ROUNDS = '10';
    const cfg = configuration() as any;

    expect(cfg.security.bcryptSaltRounds).toBe(10);
  });

  it('defaults auth.cacheDefaultTtlMs to 15 minutes in ms', () => {
    delete process.env.AUTH_CACHE_DEFAULT_TTL_MS;
    const cfg = configuration() as any;

    expect(cfg.auth.cacheDefaultTtlMs).toBe(15 * 60 * 1000);
  });

  it('parses AUTH_CACHE_DEFAULT_TTL_MS as integer', () => {
    process.env.AUTH_CACHE_DEFAULT_TTL_MS = '60000';
    const cfg = configuration() as any;

    expect(cfg.auth.cacheDefaultTtlMs).toBe(60000);
  });

  it('defaults auth.cacheMaxTtlMs to 1 hour in ms', () => {
    delete process.env.AUTH_CACHE_MAX_TTL_MS;
    const cfg = configuration() as any;

    expect(cfg.auth.cacheMaxTtlMs).toBe(60 * 60 * 1000);
  });

  it('defaults redis.url to redis://localhost:6379/0', () => {
    delete process.env.REDIS_URL;
    const cfg = configuration() as any;

    expect(cfg.redis.url).toBe('redis://localhost:6379/0');
  });

  it('reads REDIS_URL from environment', () => {
    process.env.REDIS_URL = 'redis://myhost:6380/1';
    const cfg = configuration() as any;

    expect(cfg.redis.url).toBe('redis://myhost:6380/1');
  });

  it('defaults throttle.ttl to 1 and throttle.limit to 10000', () => {
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_LIMIT;
    const cfg = configuration() as any;

    expect(cfg.security.throttle.ttl).toBe(1);
    expect(cfg.security.throttle.limit).toBe(10000);
  });

  it('parses THROTTLE_TTL and THROTTLE_LIMIT as integers', () => {
    process.env.THROTTLE_TTL = '2';
    process.env.THROTTLE_LIMIT = '500';
    const cfg = configuration() as any;

    expect(cfg.security.throttle.ttl).toBe(2);
    expect(cfg.security.throttle.limit).toBe(500);
  });

  it('defaults security.jwtSecret to empty string', () => {
    delete process.env.JWT_SECRET;
    const cfg = configuration() as any;

    expect(cfg.security.jwtSecret).toBe('');
  });

  it('reads JWT_SECRET from environment', () => {
    process.env.JWT_SECRET = 'mysecret';
    const cfg = configuration() as any;

    expect(cfg.security.jwtSecret).toBe('mysecret');
  });

  it('parses REFRESH_TOKEN_TTL_MS as integer', () => {
    process.env.REFRESH_TOKEN_TTL_MS = '86400000';
    const cfg = configuration() as any;

    expect(cfg.security.refreshTokenTtlMs).toBe(86400000);
  });

  it('applies default refreshTokenTtlMs when not set', () => {
    delete process.env.REFRESH_TOKEN_TTL_MS;
    const cfg = configuration() as any;

    expect(cfg.security.refreshTokenTtlMs).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('parses PASSWORD_RESET_TOKEN_TTL_MS as integer', () => {
    process.env.PASSWORD_RESET_TOKEN_TTL_MS = '3600000';
    const cfg = configuration() as any;

    expect(cfg.security.passwordResetTokenTtlMs).toBe(3600000);
  });

  it('applies default passwordResetTokenTtlMs when not set', () => {
    delete process.env.PASSWORD_RESET_TOKEN_TTL_MS;
    const cfg = configuration() as any;

    expect(cfg.security.passwordResetTokenTtlMs).toBe(60 * 60 * 1000);
  });

  it('parses AUTH_CACHE_MAX_TTL_MS as integer', () => {
    process.env.AUTH_CACHE_MAX_TTL_MS = '7200000';
    const cfg = configuration() as any;

    expect(cfg.auth.cacheMaxTtlMs).toBe(7200000);
  });

  it('reads JWT_ACCESS_TOKEN_EXPIRY from environment', () => {
    process.env.JWT_ACCESS_TOKEN_EXPIRY = '2h';
    const cfg = configuration() as any;

    expect(cfg.security.accessTokenExpiry).toBe('2h');
  });

  it('reads JWT_REFRESH_TOKEN_EXPIRY from environment', () => {
    process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
    const cfg = configuration() as any;

    expect(cfg.security.refreshTokenExpiry).toBe('7d');
  });

  it('reads IMGPROXY_URL, IMGPROXY_KEY, IMGPROXY_SALT from environment', () => {
    process.env.IMGPROXY_URL = 'https://img.example.com';
    process.env.IMGPROXY_KEY = 'imgkey';
    process.env.IMGPROXY_SALT = 'imgsalt';
    const cfg = configuration() as any;

    expect(cfg.imageProxy.url).toBe('https://img.example.com');
    expect(cfg.imageProxy.key).toBe('imgkey');
    expect(cfg.imageProxy.salt).toBe('imgsalt');
  });

  it('reads METRICS_API_KEY from environment', () => {
    process.env.METRICS_API_KEY = 'metricskey';
    const cfg = configuration() as any;

    expect(cfg.security.metrics.apiKey).toBe('metricskey');
  });
});
