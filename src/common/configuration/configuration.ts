import { version } from '../../../package.json';

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    name: process.env.APP_NAME || 'App',
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 8000,
    url: process.env.APP_URL || 'https://example.com',
    version,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  security: {
    shouldVerifyToken:
      String(process.env.VERIFY_TOKEN).toLowerCase() === 'true',
    jwtSecret: process.env.JWT_SECRET || '',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
    refreshTokenTtlMs: process.env.REFRESH_TOKEN_TTL_MS
      ? parseInt(process.env.REFRESH_TOKEN_TTL_MS, 10)
      : 30 * 24 * 60 * 60 * 1000,
    passwordResetTokenTtlMs: process.env.PASSWORD_RESET_TOKEN_TTL_MS
      ? parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MS, 10)
      : 60 * 60 * 1000,
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
      : 12,
    metrics: {
      apiKey: process.env.METRICS_API_KEY || '',
    },
    throttle: {
      ttl: process.env.THROTTLE_TTL
        ? parseInt(process.env.THROTTLE_TTL, 10)
        : 1,
      limit: process.env.THROTTLE_LIMIT
        ? parseInt(process.env.THROTTLE_LIMIT, 10)
        : 10000,
    },
  },
  auth: {
    cacheDefaultTtlMs: process.env.AUTH_CACHE_DEFAULT_TTL_MS
      ? parseInt(process.env.AUTH_CACHE_DEFAULT_TTL_MS, 10)
      : 15 * 60 * 1000,
    cacheMaxTtlMs: process.env.AUTH_CACHE_MAX_TTL_MS
      ? parseInt(process.env.AUTH_CACHE_MAX_TTL_MS, 10)
      : 60 * 60 * 1000,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  imageProxy: {
    url: process.env.IMGPROXY_URL || '',
    key: process.env.IMGPROXY_KEY || '',
    salt: process.env.IMGPROXY_SALT || '',
  },
});
