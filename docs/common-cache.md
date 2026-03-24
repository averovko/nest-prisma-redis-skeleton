# `src/common/cache` — Cache Module

> **Context document for AI-assisted code generation.**
> Covers purpose, architecture, public API, configuration, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Configuration](#configuration)
6. [Two Redis Clients — Key Distinction](#two-redis-clients--key-distinction)
7. [Usage Patterns](#usage-patterns)
8. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

`src/common/cache` provides a **general-purpose Redis cache service** for feature modules. It wraps an `ioredis` client (obtained from `@liaoliaots/nestjs-redis`) with a simple typed JSON get/set/del interface.

It is **distinct** from the `@nestjs/cache-manager` instance registered globally in `CommonModule` (which is used exclusively by `src/common/auth` for auth-context caching). Both use the same Redis server (`REDIS_URL`) but through different client libraries and for different purposes.

Responsibilities:
- Provide injectable `CacheService` with strongly typed `get<T>`, `set<T>`, and `del` methods.
- Automatically serialize/deserialize values as JSON.
- Apply a configurable default TTL (in seconds) when none is supplied.
- Swallow Redis errors gracefully (log and return `null` / silently ignore), so cache failures never propagate to business logic.

---

## Architecture Overview

```
Feature Service
      │
      │ @Inject(CacheService)
      ▼
  CacheService
      │
      │ this.redis.get / setex / del
      ▼
  ioredis (Redis)
  ──────────────
  via @liaoliaots/nestjs-redis  ←  RedisModule (registered in CommonModule)
```

`CacheModule` is NOT `@Global()`. It must be explicitly imported by any module that needs `CacheService`.

---

## Folder Structure

```
src/common/cache/
├── cache.module.ts     NestJS module declaration
├── cache.service.ts    Injectable CacheService
└── index.ts            Barrel export
```

---

## Files

### `cache.module.ts`

```typescript
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

Not global — import explicitly in feature modules that need it.

---

### `cache.service.ts`

**Class:** `CacheService`
**Injectable:** Yes
**Depends on:** `RedisService` (`@liaoliaots/nestjs-redis`), `ConfigService`

```typescript
@Injectable()
class CacheService {
  private readonly redis: Redis;           // ioredis client instance
  private readonly defaultTtl: number;     // from config 'cache.ttl', default 8 (seconds)
}
```

#### Methods

**`async get<T>(key: string): Promise<T | null>`**

- Calls `redis.get(key)`.
- If the key does not exist → returns `null`.
- If the stored value exists → `JSON.parse(value)` → returns `T`.
- On any Redis error → logs error, returns `null` (never throws).

**`async set<T>(key: string, value: T, ttl?: number): Promise<void>`**

- Serializes `value` with `JSON.stringify`.
- Calls `redis.setex(key, ttl ?? defaultTtl, serializedValue)`.
- TTL unit: **seconds** (raw ioredis `SETEX`).
- On any Redis error → logs error, silently continues (never throws).

**`async del(key: string): Promise<void>`**

- Calls `redis.del(key)`.
- On any Redis error → logs error, silently continues (never throws).

#### Error behaviour

All three methods catch every Redis error internally:
```typescript
catch (error) {
  this.logger.error('Failed to get/set/delete from cache', { error, key });
  // get → return null; set/del → return void
}
```

This design guarantees that a Redis outage never crashes a feature service.

---

### `index.ts`

```typescript
export * from './cache.module';
export * from './cache.service';
```

---

## Configuration

| Config path | Environment variable | Type | Default | Description |
|---|---|---|---|---|
| `cache.ttl` | _(not defined in configuration.ts — currently absent)_ | `number` | `8` | Default TTL in **seconds** for `setex` |

> **Note:** `cache.ttl` is read via `this.config.get('cache.ttl', 8)` but it is **not declared** in `src/common/configuration/configuration.ts`. The config key will always fall back to the hardcoded default of `8` seconds unless a custom configuration loader adds it. If you need a different default, either add `cache.ttl` to `configuration.ts` or pass an explicit `ttl` to `CacheService.set()`.

The underlying Redis connection is provided by `RedisModule` (configured in `CommonModule` using `REDIS_URL`):

```typescript
RedisModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService) => ({
    url: configService.get<string>('redis.url'),
  }),
})
```

| Environment variable | Config path | Default |
|---|---|---|
| `REDIS_URL` | `redis.url` | `redis://localhost:6379/0` |

---

## Two Redis Clients — Key Distinction

The application has **two separate Redis integrations**, both connecting to the same `REDIS_URL`:

| Client | Library | Configured in | Used by |
|---|---|---|---|
| `ioredis` via `RedisService` | `@liaoliaots/nestjs-redis` | `CommonModule` → `RedisModule` | `CacheService` (this module) — general-purpose JSON cache |
| `cache-manager` via Keyv | `@nestjs/cache-manager` + `@keyv/redis` | `CommonModule` → `CacheModule.registerAsync` | `CacheManagerAuthCtxCacheAdapter` — JWT auth context cache |

They share the same Redis server but are **independent client instances** with different key namespaces and TTL semantics:
- `CacheService` uses raw `SETEX` with TTL in **seconds**.
- `CacheManagerAuthCtxCacheAdapter` uses `cache-manager`'s `set(key, value, ttlMs)` with TTL in **milliseconds**.

---

## Usage Patterns

### Importing in a feature module

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from 'src/common/cache';

@Module({
  imports: [CacheModule],
  providers: [UserService],
})
export class UserModule {}
```

### Injecting and using in a service

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: CacheService) {}

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;

    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findById(id);
    if (user) {
      await this.cacheService.set<User>(cacheKey, user, 300); // 300 seconds
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, data);
    await this.cacheService.del(`user:${id}`);
    return user;
  }
}
```

### Using the default TTL

```typescript
await this.cacheService.set('some:key', payload);
// Stored with TTL = config 'cache.ttl' (default 8 seconds)
```

---

## Public Barrel Exports

From `src/common/cache/index.ts`:

```typescript
export { CacheModule } from './cache.module';
export { CacheService } from './cache.service';
```

From `src/common/index.ts`:

```typescript
export * from './cache';
// → CacheModule, CacheService available from 'src/common'
```

---

## Test Coverage Map

| Spec file | Source file | What is tested |
|---|---|---|
| `cache/cache.service.spec.ts` | `cache.service.ts` | `get` (hit, miss, Redis error); `set` (explicit TTL, default TTL, Redis error); `del` (success, Redis error); constructor reads `cache.ttl` from `ConfigService` |

**Coverage achieved:** 100 % statements · 100 % functions · 100 % lines · 83 % branches (the remaining branch gap is a TypeScript `private readonly` constructor parameter instrumentation artifact — not addressable by tests).
