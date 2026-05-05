# `src/common/configuration` — Configuration Module

> **Context document for AI-assisted code generation.**
> Covers purpose, architecture, all configuration keys, environment variables, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Complete Configuration Schema](#complete-configuration-schema)
6. [Environment Variable Reference](#environment-variable-reference)
7. [Usage Patterns](#usage-patterns)
8. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

`src/common/configuration` is the **single source of truth** for all application configuration. It:

- Loads `.env` files in priority order (see below) using `@nestjs/config`.
- Maps raw environment variables into a typed, nested configuration object.
- Provides a global `AppConfigModule` that makes `ConfigService` available everywhere via NestJS DI.

**No feature module should read `process.env` directly.** All configuration access goes through the injected `ConfigService`.

---

## Architecture Overview

```
.env / .env.local / .env.production / ...
              │
              │ ConfigModule.forRoot({ load: [configuration] })
              ▼
    configuration() factory function
              │  returns typed nested object
              ▼
         ConfigService  (@Global via AppConfigModule)
              │
              │ config.get('path.to.key', defaultValue)
              ▼
    Any service/adapter/factory in the application
```

`AppConfigModule` is registered as **global** via `ConfigModule.forRoot({ isGlobal: true })`, so `ConfigService` is automatically available without importing `AppConfigModule` in every feature module.

---

## Folder Structure

```
src/common/configuration/
├── config.module.ts    NestJS AppConfigModule declaration
└── configuration.ts    Typed configuration factory function
```

---

## Files

### `config.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env.production.local',
        '.env.production',
        '.env.development.local',
        '.env.development',
        '.env',
      ],
      load: [configuration],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
```

**Key properties:**
- `isGlobal: true` — `ConfigService` is injectable in any module without re-importing.
- `envFilePath` — Files are loaded left-to-right, first match wins. `.env.local` has the highest priority; `.env` is the lowest-priority fallback.
- `load: [configuration]` — Runs the typed factory that maps env vars to the nested config object.

---

### `configuration.ts`

A factory function that returns the complete application configuration object:

```typescript
export default () => ({
  nodeEnv: string,
  app: { name, port, url, version },
  logLevel: string,
  security: {
    shouldVerifyToken: boolean,
    jwtSecret: string,
    accessTokenExpiry: string,
    refreshTokenExpiry: string,
    refreshTokenTtlMs: number,
    passwordResetTokenTtlMs: number,
    emailVerificationTokenTtlMs: number,
    bcryptSaltRounds: number,
    metrics: { apiKey: string },
    throttle: { ttl: number, limit: number },
  },
  auth: {
    cacheDefaultTtlMs: number,
    cacheMaxTtlMs: number,
  },
  database: {
    master: { host, port, user, password, name, sslMode },
    readReplicas: Array<{ host, port, user, password, name, sslMode }>,
  },
  redis: { url: string },
  imageProxy: { url: string, key: string, salt: string },
})
```

---

## Complete Configuration Schema

### `nodeEnv`

| Path | Env var | Type | Default |
|---|---|---|---|
| `nodeEnv` | `NODE_ENV` | `string` | `'development'` |

---

### `app.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `app.name` | `APP_NAME` | `string` | `'App'` | Application name (used in Swagger title) |
| `app.port` | `APP_PORT` | `number` | `8000` | HTTP listen port |
| `app.url` | `APP_URL` | `string` | `'https://example.com'` | Public base URL |
| `app.version` | _(from package.json)_ | `string` | _(package version)_ | Auto-read via `import { version } from '../../../package.json'` |

---

### `logLevel`

| Path | Env var | Type | Default |
|---|---|---|---|
| `logLevel` | `LOG_LEVEL` | `string` | `'info'` |

---

### `security.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `security.shouldVerifyToken` | `VERIFY_TOKEN` | `boolean` | `false` | When `true`, JWTs are cryptographically verified. **Must be `true` in production.** |
| `security.jwtSecret` | `JWT_SECRET` | `string` | `''` | HMAC secret for JWT signing/verification |
| `security.accessTokenExpiry` | `JWT_ACCESS_TOKEN_EXPIRY` | `string` | `'1h'` | Access token lifetime (e.g. `'15m'`, `'1h'`) |
| `security.refreshTokenExpiry` | `JWT_REFRESH_TOKEN_EXPIRY` | `string` | `'30d'` | Refresh token lifetime |
| `security.refreshTokenTtlMs` | `REFRESH_TOKEN_TTL_MS` | `number` | `2592000000` (30 days) | Refresh token DB record TTL in milliseconds |
| `security.passwordResetTokenTtlMs` | `PASSWORD_RESET_TOKEN_TTL_MS` | `number` | `3600000` (1 hour) | Password reset token TTL in milliseconds |
| `security.emailVerificationTokenTtlMs` | `EMAIL_VERIFICATION_TOKEN_TTL_MS` | `number` | `86400000` (24 hours) | Email verification token TTL in milliseconds |
| `security.bcryptSaltRounds` | `BCRYPT_SALT_ROUNDS` | `number` | `12` | bcrypt cost factor for password hashing |
| `security.metrics.apiKey` | `METRICS_API_KEY` | `string` | `''` | Static API key for metrics/internal endpoints |
| `security.throttle.ttl` | `THROTTLE_TTL` | `number` | `1` | Rate-limiter window duration (seconds) |
| `security.throttle.limit` | `THROTTLE_LIMIT` | `number` | `10000` | Max requests per `throttle.ttl` window |

---

### Verify Email Token Lifecycle

- `security.emailVerificationTokenTtlMs` controls the lifetime of records in `EmailVerificationToken`.
- `POST /v1/authentication/verify-email` consumes a raw token and checks its SHA-256 hash in storage.
- The endpoint is idempotent at API level and returns `200` with `{ "status": "ok" }` for valid, missing, already-used, or expired tokens.
- When token is valid and not expired, credentials are marked as verified and all verification tokens for that account are removed.

### `auth.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `auth.cacheDefaultTtlMs` | `AUTH_CACHE_DEFAULT_TTL_MS` | `number` | `900000` (15 min) | Default TTL for JWT auth context cache entries |
| `auth.cacheMaxTtlMs` | `AUTH_CACHE_MAX_TTL_MS` | `number` | `3600000` (1 hour) | Maximum TTL cap for JWT auth context cache entries |

---

### `database.master.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `database.master.host` | `POSTGRES_HOST` | `string` | `'localhost'` | Master PostgreSQL host |
| `database.master.port` | `POSTGRES_PORT` | `number` | `5432` | Master PostgreSQL port |
| `database.master.user` | `POSTGRES_USER` | `string` | `''` | Master PostgreSQL user |
| `database.master.password` | `POSTGRES_PASSWORD` | `string` | `''` | Master PostgreSQL password |
| `database.master.name` | `POSTGRES_DB` | `string` | `''` | Master PostgreSQL database name |
| `database.master.sslMode` | `POSTGRES_SSLMODE` | `string` | `'verify-full'` | Master PostgreSQL SSL mode |

---

### `database.readReplicas[]`

Read replicas are indexed and discovered automatically:
- `READ_REPLICA0_POSTGRES_*`
- `READ_REPLICA1_POSTGRES_*`
- `READ_REPLICA2_POSTGRES_*`
- ...

Each replica node has the same structure as `database.master`:
- `host` (`READ_REPLICA{n}_POSTGRES_HOST`)
- `port` (`READ_REPLICA{n}_POSTGRES_PORT`, default `5432`)
- `user` (`READ_REPLICA{n}_POSTGRES_USER`)
- `password` (`READ_REPLICA{n}_POSTGRES_PASSWORD`)
- `name` (`READ_REPLICA{n}_POSTGRES_DB`)
- `sslMode` (`READ_REPLICA{n}_POSTGRES_SSLMODE`, default `'verify-full'`)

If `READ_REPLICA{n}_POSTGRES_HOST` is missing for an index, scanning stops at that index.

---

### `redis.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `redis.url` | `REDIS_URL` | `string` | `'redis://localhost:6379/0'` | Redis connection URL used by both `CacheModule` (`ioredis`) and `@nestjs/cache-manager` (Keyv) |

---

### `imageProxy.*`

| Path | Env var | Type | Default | Description |
|---|---|---|---|---|
| `imageProxy.url` | `IMGPROXY_URL` | `string` | `''` | imgproxy base URL |
| `imageProxy.key` | `IMGPROXY_KEY` | `string` | `''` | imgproxy signing key (hex) |
| `imageProxy.salt` | `IMGPROXY_SALT` | `string` | `''` | imgproxy signing salt (hex) |

---

## Environment Variable Reference

Complete alphabetical list for `.env` files:

```dotenv
# Application
APP_NAME=MyApp
APP_PORT=8000
APP_URL=https://example.com
NODE_ENV=production
LOG_LEVEL=info

# Security / JWT
VERIFY_TOKEN=true
JWT_SECRET=your-secret-here
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=30d
REFRESH_TOKEN_TTL_MS=2592000000
PASSWORD_RESET_TOKEN_TTL_MS=3600000
EMAIL_VERIFICATION_TOKEN_TTL_MS=86400000
BCRYPT_SALT_ROUNDS=12

# API Key
METRICS_API_KEY=changeme

# Rate limiting
THROTTLE_TTL=1
THROTTLE_LIMIT=10000

# Auth context cache
AUTH_CACHE_DEFAULT_TTL_MS=900000
AUTH_CACHE_MAX_TTL_MS=3600000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=postgres
POSTGRES_SSLMODE=disable

# Database read replica 0 (optional)
READ_REPLICA0_POSTGRES_HOST=localhost
READ_REPLICA0_POSTGRES_PORT=5433
READ_REPLICA0_POSTGRES_USER=postgres_user
READ_REPLICA0_POSTGRES_PASSWORD=postgres_password
READ_REPLICA0_POSTGRES_DB=postgres
READ_REPLICA0_POSTGRES_SSLMODE=disable

# Redis
REDIS_URL=redis://localhost:6379/0

# Image proxy (optional)
IMGPROXY_URL=
IMGPROXY_KEY=
IMGPROXY_SALT=
```

> **Note:** Database settings are part of the `configuration()` factory under `database.*` and are consumed in `PrismaService` via `ConfigService.getOrThrow('database')`.

---

## Usage Patterns

### Reading configuration in a service

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExampleService {
  constructor(private readonly config: ConfigService) {}

  getSomething(): string {
    return this.config.get<string>('app.name', 'App');
  }

  isProduction(): boolean {
    return this.config.get<string>('nodeEnv') === 'production';
  }
}
```

### Reading configuration in a module factory

```typescript
@Module({
  imports: [
    SomeLibModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('security.jwtSecret'),
        expiresIn: config.get<string>('security.accessTokenExpiry', '1h'),
      }),
    }),
  ],
})
export class SomeModule {}
```

### Accessing nested config

```typescript
// Path uses dot notation for nested keys
config.get<boolean>('security.shouldVerifyToken', false)
config.get<number>('auth.cacheDefaultTtlMs', 900_000)
config.get<string>('security.metrics.apiKey', '')
```

---

## Public Barrel Exports

`AppConfigModule` is imported directly — it is not re-exported from `src/common/index.ts`.

Import path:

```typescript
import { AppConfigModule } from 'src/common/configuration/config.module';
```

Used in:
- `src/common/common.module.ts` — imports `AppConfigModule` to bootstrap global config.
- `src/common/auth/auth.module.ts` — imports `AppConfigModule` to access `security.*` and `auth.*` keys.

---

## Test Coverage Map

| Spec file | Source file | What is tested |
|---|---|---|
| `configuration/configuration.spec.ts` | `configuration.ts` | All defaults when env vars unset; `APP_PORT`, `APP_NAME`, `APP_URL`, `NODE_ENV`, `LOG_LEVEL` from env; `VERIFY_TOKEN=true/false` → boolean coercion; `BCRYPT_SALT_ROUNDS`, `THROTTLE_TTL`, `THROTTLE_LIMIT`, `REFRESH_TOKEN_TTL_MS`, `PASSWORD_RESET_TOKEN_TTL_MS`, `AUTH_CACHE_DEFAULT_TTL_MS`, `AUTH_CACHE_MAX_TTL_MS` parsed as integers; `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRY`, `JWT_REFRESH_TOKEN_EXPIRY`; `REDIS_URL`; `IMGPROXY_URL/KEY/SALT`; `METRICS_API_KEY`; `app.version` from `package.json` |

**Coverage achieved:** 100 % statements · 100 % functions · 100 % lines · 100 % branches.
