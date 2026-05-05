import { version } from '../../../package.json';

type DatabaseNodeConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  sslMode?: string;
};

function toInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function getReplicaConfig(index: number): DatabaseNodeConfig | null {
  const host = process.env[`READ_REPLICA${index}_POSTGRES_HOST`];
  if (!host) {
    return null;
  }
  return {
    host,
    port: toInt(process.env[`READ_REPLICA${index}_POSTGRES_PORT`], 5432),
    user: process.env[`READ_REPLICA${index}_POSTGRES_USER`] || '',
    password: process.env[`READ_REPLICA${index}_POSTGRES_PASSWORD`] || '',
    name: process.env[`READ_REPLICA${index}_POSTGRES_DB`] || '',
    sslMode:
      process.env[`READ_REPLICA${index}_POSTGRES_SSLMODE`] || 'verify-full',
  };
}

function getReadReplicas(): DatabaseNodeConfig[] {
  const replicas: DatabaseNodeConfig[] = [];
  let index = 0;
  while (true) {
    const replica = getReplicaConfig(index);
    if (!replica) {
      break;
    }
    replicas.push(replica);
    index++;
  }
  return replicas;
}

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    name: process.env.APP_NAME || 'App',
    port: toInt(process.env.APP_PORT, 8000),
    url: process.env.APP_URL || 'https://example.com',
    version,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  security: {
    shouldVerifyToken: toBoolean(process.env.VERIFY_TOKEN, false),
    jwtSecret: process.env.JWT_SECRET || '',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
    refreshTokenTtlMs: toInt(
      process.env.REFRESH_TOKEN_TTL_MS,
      30 * 24 * 60 * 60 * 1000,
    ),
    passwordResetTokenTtlMs: toInt(
      process.env.PASSWORD_RESET_TOKEN_TTL_MS,
      60 * 60 * 1000,
    ),
    emailVerificationTokenTtlMs: toInt(
      process.env.EMAIL_VERIFICATION_TOKEN_TTL_MS,
      24 * 60 * 60 * 1000,
    ),
    bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
    metrics: {
      apiKey: process.env.METRICS_API_KEY || '',
    },
    throttle: {
      ttl: toInt(process.env.THROTTLE_TTL, 1),
      limit: toInt(process.env.THROTTLE_LIMIT, 10000),
    },
  },
  auth: {
    cacheDefaultTtlMs: toInt(
      process.env.AUTH_CACHE_DEFAULT_TTL_MS,
      15 * 60 * 1000,
    ),
    cacheMaxTtlMs: toInt(process.env.AUTH_CACHE_MAX_TTL_MS, 60 * 60 * 1000),
  },
  database: {
    master: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: toInt(process.env.POSTGRES_PORT, 5432),
      user: process.env.POSTGRES_USER || '',
      password: process.env.POSTGRES_PASSWORD || '',
      name: process.env.POSTGRES_DB || '',
      sslMode: process.env.POSTGRES_SSLMODE || 'verify-full',
    },
    readReplicas: getReadReplicas(),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },
  imageProxy: {
    url: process.env.IMGPROXY_URL || '',
    key: process.env.IMGPROXY_KEY || '',
    salt: process.env.IMGPROXY_SALT || '',
  },
  notification: {
    email: {
      provider: process.env.NOTIFICATION_EMAIL_PROVIDER || 'console',
      from: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@example.com',
      smtp: {
        host: process.env.NOTIFICATION_SMTP_HOST || 'localhost',
        port: toInt(process.env.NOTIFICATION_SMTP_PORT, 587),
        secure: toBoolean(process.env.NOTIFICATION_SMTP_SECURE, false),
        user: process.env.NOTIFICATION_SMTP_USER || '',
        pass: process.env.NOTIFICATION_SMTP_PASS || '',
      },
      sendgrid: {
        apiKey: process.env.NOTIFICATION_SENDGRID_API_KEY || '',
      },
      unisender: {
        apiKey: process.env.NOTIFICATION_UNISENDER_API_KEY || '',
      },
    },
    sms: {
      provider: process.env.NOTIFICATION_SMS_PROVIDER || 'console',
      unisender: {
        apiKey: process.env.NOTIFICATION_UNISENDER_API_KEY || '',
        senderName: process.env.NOTIFICATION_SMS_SENDER_NAME || 'App',
      },
    },
    appName: process.env.APP_NAME || 'App',
    appDomain: process.env.APP_DOMAIN || 'example.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://example.com',
  },
});
