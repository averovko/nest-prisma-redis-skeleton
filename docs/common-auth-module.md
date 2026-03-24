# `src/common/auth` — Authentication & Authorization Module

> **Context document for AI-assisted code generation.**
> Covers architecture, every layer's purpose, all public APIs, data flow, configuration, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Domain Layer](#domain-layer)
5. [Application Layer](#application-layer)
6. [Infrastructure Adapters](#infrastructure-adapters)
7. [Presentation Adapters (NestJS)](#presentation-adapters-nestjs)
8. [Module Wiring (`AuthModule`)](#module-wiring-authmodule)
9. [Configuration & Environment Variables](#configuration--environment-variables)
10. [Complete Request Flow](#complete-request-flow)
11. [Usage Patterns in Controllers](#usage-patterns-in-controllers)
12. [Error Handling Chain](#error-handling-chain)
13. [Caching Strategy](#caching-strategy)
14. [Public Barrel Exports](#public-barrel-exports)
15. [Test Coverage Map](#test-coverage-map)

---

## Purpose & Responsibilities

`src/common/auth` is the **single, shared authentication and authorization infrastructure** for the entire application.

It is responsible for:

- Resolving a JWT Bearer token into a typed `AuthCtx` domain aggregate (who is calling and with what identity).
- Looking up the database `User` record associated with the JWT's `sub` claim (`authId`).
- Caching the resolved `AuthCtx` in Redis to avoid repeated JWT verification and DB queries.
- Validating `x-api-key` header for internal/metrics routes.
- Providing NestJS guards and parameter decorators that controllers use declaratively.
- Mapping auth errors to HTTP-appropriate `AppError` instances.

It does **not** issue tokens, store credentials, or implement registration/login — that is `src/authentication`'s responsibility.

---

## Architecture Overview

The module follows **Hexagonal Architecture** (Ports & Adapters):

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  JWTGuard  OptionalAuthGuard  RolesGuard  ApiKeyGuard           │
│  @AuthContext  @AuthContextUser  @OptionalAuthContext           │
│  @RequireAnyRoles                                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │ calls
┌───────────────────────▼─────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  ResolveAuthCtxUseCase   ValidateApiKeyUseCase                  │
│  AuthCtxFacade helpers (extractUser, extractPerson, assertRoles)│
│  AuthAppError  (typed error codes)                              │
│  Ports (interfaces): AuthTokenPort  UserLookupPort              │
│                       AuthCtxCachePort  CachePolicyPort         │
│                       ExpectedApiKeyPort                        │
└──────┬────────────────────────────────────────────┬────────────┘
       │ implements                                  │ implements
┌──────▼─────────────────────┐     ┌────────────────▼────────────┐
│  INFRASTRUCTURE ADAPTERS   │     │  INFRASTRUCTURE ADAPTERS    │
│  JwtAuthTokenAdapter       │     │  PrismaUserLookupAdapter     │
│  CacheManagerAuthCtxCache  │     │  ConfigCachePolicyAdapter   │
│  ConfigExpectedApiKeyAdapter│    │                             │
└──────┬─────────────────────┘     └────────────────┬────────────┘
       │                                             │
  @nestjs/jwt                                  PrismaService
  @nestjs/cache-manager (Redis)                (PostgreSQL)
  ConfigService                                ConfigService
```

```
┌────────────────────────────────┐
│        DOMAIN LAYER            │
│  AuthCtx  (aggregate)          │
│  User  (read model interface)  │
│  Role  (enum)                  │
│  AgentType  (enum)             │
│  Person  Service  (interfaces) │
│  AuthDomainError               │
└────────────────────────────────┘
```

---

## Folder Structure

```
src/common/auth/
├── auth.module.ts                          NestJS @Global() module
├── index.ts                                Public barrel (re-exports domain + presentation)
│
├── domain/
│   ├── index.ts
│   ├── entities/
│   │   ├── auth-ctx.model.ts               Core AuthCtx aggregate
│   │   ├── auth-ctx.model.spec.ts
│   │   ├── role.enum.ts                    Role enum
│   │   └── user.model.ts                  User read-model interface
│   └── errors/
│       ├── auth-domain-error.ts
│       └── auth-domain-error.spec.ts
│
├── application/
│   ├── index.ts                            Application public barrel
│   ├── dto/
│   │   └── token-payload.ts               Normalized JWT claims
│   ├── errors/
│   │   ├── auth-app-error.ts
│   │   └── auth-app-error.spec.ts
│   ├── facades/
│   │   ├── auth-ctx-facade.ts             Bridge: domain errors → AuthAppError
│   │   └── auth-ctx-facade.spec.ts
│   ├── ports/
│   │   ├── auth-token.port.ts
│   │   ├── auth-ctx-cache.port.ts
│   │   ├── cache-policy.port.ts
│   │   ├── expected-api-key.port.ts
│   │   ├── resolve-auth-ctx.use-case.port.ts
│   │   ├── user-lookup.port.ts
│   │   └── validate-api-key.use-case.port.ts
│   └── use-cases/
│       ├── resolve-auth-ctx.use-case.ts
│       ├── resolve-auth-ctx.use-case.spec.ts
│       ├── validate-api-key.use-case.ts
│       └── validate-api-key.use-case.spec.ts
│
└── adapter/
    ├── infrastructure/
    │   ├── jwt-auth-token.settings.ts      DI token + settings interface
    │   ├── jwt-auth-token.adapter.ts       AuthTokenPort → @nestjs/jwt
    │   ├── jwt-auth-token.adapter.spec.ts
    │   ├── cache-manager-auth-ctx-cache.adapter.ts  AuthCtxCachePort → cache-manager
    │   ├── cache-manager-auth-ctx-cache.adapter.spec.ts
    │   ├── config-cache-policy.adapter.ts  CachePolicyPort → ConfigService
    │   ├── config-cache-policy.adapter.spec.ts
    │   ├── config-expected-api-key.adapter.ts  ExpectedApiKeyPort → ConfigService
    │   ├── config-expected-api-key.adapter.spec.ts
    │   ├── prisma-user-lookup.adapter.ts   UserLookupPort → PrismaService
    │   └── prisma-user-lookup.adapter.spec.ts
    └── presentation/
        └── nestjs/
            ├── index.ts                    Presentation barrel
            ├── types.ts                    RequestWithAuthCtx type
            ├── auth-error.mapper.ts        AuthAppError → AppError (HTTP)
            ├── auth-error.mapper.spec.ts
            ├── jwt.guard.ts                JWTGuard (requires valid token)
            ├── jwt.guard.spec.ts
            ├── optional-auth.guard.ts      OptionalAuthGuard (no token = ok)
            ├── optional-auth.guard.spec.ts
            ├── role.guard.ts               RolesGuard (requires @RequireAnyRoles)
            ├── role.guard.spec.ts
            ├── api-key.guard.ts            ApiKeyGuard (x-api-key header)
            ├── api-key.guard.spec.ts
            └── decorators/
                ├── auth-context.decorator.ts          @AuthContext()
                ├── auth-context.decorator.spec.ts
                ├── auth-context-user.decorator.ts     @AuthContextUser()
                ├── auth-context-user.decorator.spec.ts
                ├── optional-auth-context.decorator.ts @OptionalAuthContext()
                ├── optional-auth-context.decorator.spec.ts
                ├── require-any-roles.decorator.ts     @RequireAnyRoles()
                └── require-any-roles.decorator.spec.ts
```

---

## Domain Layer

### `AuthCtx` — Core Aggregate

**File:** `domain/entities/auth-ctx.model.ts`

The central object that represents "who is making a request". An `AuthCtx` holds either:

- A **person** agent: a JWT owner with optional `Person` identity data (authId, email, phone) and an optional DB-loaded `User`.
- A **service** agent: a machine/service identity with an `id` (currently unused by production flows, reserved for future M2M).

```typescript
class AuthCtx {
  static forPerson(person: Person, user: User | undefined, expireAt?: number): AuthCtx
  static forService(service: Service, expireAt?: number): AuthCtx
  static fromSnapshot(snapshot: AuthCtxSnapshot): AuthCtx

  isPerson(): boolean
  isService(): boolean
  isUser(): boolean           // true when person context has a loaded DB user
  getAgentType(): AgentType
  getExpireAt(): number | undefined
  getPerson(): Person | undefined
  getService(): Service | undefined
  getUser(): User | undefined
  requireUser(): User         // throws AuthDomainError('require-user') if absent
  requirePerson(): Person     // throws AuthDomainError('require-person') if absent
  assertHasAnyRole(roles: Role[]): void  // throws AuthDomainError('no-privilege') if unmet
  toSnapshot(): AuthCtxSnapshot         // plain object for cache serialization
}
```

**Key contract:** `AuthCtx` is **immutable** after construction (all properties `private readonly`). Serialized to/from `AuthCtxSnapshot` for Redis storage.

---

### `User` — Read-Model Interface

**File:** `domain/entities/user.model.ts`

```typescript
interface User {
  id: string;
  authId: string;          // UUID from JWT sub claim — links auth to DB record
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Mirrors the Prisma `User` model fields. Used read-only throughout the auth module.

---

### `Role` — Enum

**File:** `domain/entities/role.enum.ts`

```typescript
enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
  ROOT = 'ROOT',
}
```

Maps 1:1 to the Prisma `UserRole` enum. Used in `assertHasAnyRole` and `@RequireAnyRoles()`.

---

### `AgentType` — Enum

```typescript
enum AgentType {
  person = 'person',
  service = 'service',
}
```

Stored in `AuthCtxSnapshot.agentType` and used by `CacheManagerAuthCtxCacheAdapter.isAuthCtxSnapshot` for deserialization validation.

---

### `Person` / `Service` — Interfaces

```typescript
interface Person {
  authId: string;
  email?: string;
  phone?: string;
}

interface Service {
  id: string;
}
```

`Person` is populated directly from JWT claims. `Service` is a placeholder for future M2M auth.

---

### `AuthDomainError`

**File:** `domain/errors/auth-domain-error.ts`

```typescript
type AuthDomainErrorCode = 'require-user' | 'require-person' | 'no-privilege';

class AuthDomainError extends Error {
  readonly name = 'AuthDomainError';
  readonly code: AuthDomainErrorCode;
  readonly params?: Record<string, unknown>;
}
```

Thrown only by `AuthCtx` methods. Never escapes to HTTP — always caught by `AuthCtxFacade` and re-thrown as `AuthAppError`.

---

## Application Layer

### Ports (Interfaces)

All ports use Symbol injection tokens to avoid string collisions.

| Symbol constant | Interface | Description |
|---|---|---|
| `AUTH_TOKEN_PORT` | `AuthTokenPort` | Resolves a raw JWT string → `TokenPayload` |
| `USER_LOOKUP_PORT` | `UserLookupPort` | Finds a `User` by `authId` |
| `AUTH_CTX_CACHE_PORT` | `AuthCtxCachePort` | Get/set `AuthCtx` by token (Redis) |
| `CACHE_POLICY_PORT` | `CachePolicyPort` | Returns default and max TTL in ms |
| `EXPECTED_API_KEY_PORT` | `ExpectedApiKeyPort` | Returns the configured API key string |
| `RESOLVE_AUTH_CTX_USE_CASE` | `IResolveAuthCtxUseCase` | Main use-case: token → `AuthCtx` |
| `VALIDATE_API_KEY_USE_CASE` | `IValidateApiKeyUseCase` | Validates `x-api-key` header value |

---

### `TokenPayload` DTO

**File:** `application/dto/token-payload.ts`

```typescript
interface TokenPayload {
  sub: string;      // authId (UUID) — REQUIRED
  email?: string;
  phone?: string;
  exp?: number;     // Unix timestamp seconds
}
```

Internal DTO. Never exposed to controllers; used only inside `ResolveAuthCtxUseCase`.

---

### `ResolveAuthCtxUseCase`

**File:** `application/use-cases/resolve-auth-ctx.use-case.ts`

The core orchestration flow:

```
execute(token: string): Promise<AuthCtx>

1. Check Redis cache → return cached AuthCtx if hit.
2. Resolve JWT payload via AuthTokenPort (decode or verify).
3. Build Person { authId, email, phone } from payload.
4. Look up User by authId via UserLookupPort (may be undefined).
5. Construct AuthCtx.forPerson(person, user, payload.exp).
6. If shouldCache → compute TTL (min of default, capped at max, respects JWT exp) → store in cache.
7. Return AuthCtx.
```

**Caching rule:** Only caches when `authCtx.isUser()` is true (person agent with DB user loaded). Service agents also qualify by `shouldCache` logic but are not constructed by this use case today.

**TTL resolution:**
- If JWT has `exp` claim: `ttl = exp * 1000 - Date.now()` (remaining token lifetime).
- Capped to `CachePolicyPort.getMaxTtlMs()` (default 1 hour).
- Falls back to `CachePolicyPort.getDefaultTtlMs()` (default 15 min) when no `exp`.
- TTL ≤ 0 → skip caching.

---

### `ValidateApiKeyUseCase`

**File:** `application/use-cases/validate-api-key.use-case.ts`

```
execute(apiKey: string | undefined): void
→ throws AuthAppError('invalid-api-key') if apiKey is absent or doesn't match config
```

Simple constant-time equality check via `ExpectedApiKeyPort.getExpectedApiKey()`.

---

### `AuthAppError`

**File:** `application/errors/auth-app-error.ts`

```typescript
type AuthAppErrorCode =
  | 'invalid-token'    // JWT missing, malformed, or failed verification
  | 'invalid-api-key'  // x-api-key header missing or wrong
  | 'require-user'     // AuthCtx has no loaded DB User
  | 'require-person'   // AuthCtx has no Person (not a person agent)
  | 'no-privilege'     // User lacks required Role(s)
  | 'server-error';    // Unexpected error (wraps cause)

class AuthAppError extends Error {
  readonly name = 'AuthAppError';
  readonly code: AuthAppErrorCode;
  readonly params?: Record<string, unknown>;
  // supports { cause: Error } options for error chaining
}
```

All auth failures surface through this error type before being mapped to HTTP.

---

### `AuthCtxFacade` — Helper Functions

**File:** `application/facades/auth-ctx-facade.ts`

Three pure functions used by decorators and guards to extract data from `AuthCtx`, bridging `AuthDomainError` → `AuthAppError`:

```typescript
function extractUser(authCtx: AuthCtx): User
// Returns User or throws AuthAppError('require-user')

function extractPerson(authCtx: AuthCtx): Person
// Returns Person or throws AuthAppError('require-person')

function assertRoles(authCtx: AuthCtx, roles: Role[]): void
// Passes or throws AuthAppError('no-privilege' | 'require-user')
```

---

## Infrastructure Adapters

### `JwtAuthTokenAdapter`

**File:** `adapter/infrastructure/jwt-auth-token.adapter.ts`  
**Implements:** `AuthTokenPort`  
**Depends on:** `JwtService` (@nestjs/jwt), `JWT_AUTH_TOKEN_SETTINGS`

**Behavior controlled by `shouldVerifyToken` setting:**

| `shouldVerifyToken` | Behavior |
|---|---|
| `false` (dev/test) | `jwtService.decode(token)` — trusts token without signature check |
| `true` (production) | `jwtService.verifyAsync(token, { secret })` — full RS256/HS256 verification |

Both paths produce a `TokenPayload` or throw `AuthAppError('invalid-token')` if:
- Token is not a valid JWT.
- Decoded payload has no `sub` string claim.
- Verification fails (expired, wrong secret, etc.).

**Settings interface:**

```typescript
interface JwtAuthTokenSettings {
  shouldVerifyToken: boolean;
  jwtSecret: string;
}
// Injected via DI token: JWT_AUTH_TOKEN_SETTINGS
```

---

### `CacheManagerAuthCtxCacheAdapter`

**File:** `adapter/infrastructure/cache-manager-auth-ctx-cache.adapter.ts`  
**Implements:** `AuthCtxCachePort`  
**Depends on:** `CACHE_MANAGER` (@nestjs/cache-manager → Keyv + Redis)

**Cache key format:** `authCtx:<jwt-signature>` (third JWT segment — avoids storing full token in key).

```typescript
async getByToken(token: string): Promise<AuthCtx | null>
// Deserializes AuthCtxSnapshot → AuthCtx.fromSnapshot()
// Validates snapshot has valid agentType before reconstruction

async setByToken(token: string, authCtx: AuthCtx, ttlMs: number): Promise<void>
// Serializes via authCtx.toSnapshot() → plain object → stored in Redis
```

---

### `ConfigCachePolicyAdapter`

**File:** `adapter/infrastructure/config-cache-policy.adapter.ts`  
**Implements:** `CachePolicyPort`  
**Depends on:** `ConfigService`

```typescript
getDefaultTtlMs(): number  // → auth.cacheDefaultTtlMs (default: 900_000 ms = 15 min)
getMaxTtlMs(): number      // → auth.cacheMaxTtlMs     (default: 3_600_000 ms = 1 h)
```

---

### `ConfigExpectedApiKeyAdapter`

**File:** `adapter/infrastructure/config-expected-api-key.adapter.ts`  
**Implements:** `ExpectedApiKeyPort`  
**Depends on:** `ConfigService`

```typescript
getExpectedApiKey(): string  // → security.metrics.apiKey (METRICS_API_KEY env var)
```

---

### `PrismaUserLookupAdapter`

**File:** `adapter/infrastructure/prisma-user-lookup.adapter.ts`  
**Implements:** `UserLookupPort`  
**Depends on:** `PrismaService`

```typescript
async findByAuthId(authId: string): Promise<User | undefined>
// prismaService.client.user.findUnique({ where: { authId } })
// Maps Prisma row → domain User; roles are cast as Role[]
// Returns undefined (not null) when user not found
```

---

## Presentation Adapters (NestJS)

### `RequestWithAuthCtx` — Extended Request Type

**File:** `adapter/presentation/nestjs/types.ts`

```typescript
type RequestWithAuthCtx = Request & { authCtx?: AuthCtx }
```

Used internally by guards and decorators as the typed request object. `authCtx` is `undefined` until a guard resolves it.

---

### Guards

#### `JWTGuard` (also exported as `AuthGuard`)

**Use when:** Route **requires** an authenticated user with a valid JWT.

**Behavior:**
1. Extracts `Authorization: Bearer <token>` header.
2. If missing → throws `AppError` (HTTP 401 `auth.invalid-token`).
3. Calls `ResolveAuthCtxUseCase.execute(token)`.
4. On success → sets `request.authCtx = authCtx`.
5. On `AuthAppError` → maps to `AppError` and throws.

```typescript
@UseGuards(JWTGuard)
// or equivalently:
@UseGuards(AuthGuard)
```

---

#### `OptionalAuthGuard`

**Use when:** Route works both anonymously and authenticated (e.g., public feed with personalized data for logged-in users).

**Behavior:**
- No `Authorization` header → returns `true`, `request.authCtx` stays `undefined`.
- Valid token → resolves and sets `request.authCtx`.
- Token present but **invalid** (`invalid-token`) → silently ignores, continues unauthenticated.
- Other `AuthAppError` → re-throws as `AppError`.

```typescript
@UseGuards(OptionalAuthGuard)
```

---

#### `RolesGuard`

**Use when:** Route requires a specific role after JWT authentication. **Must be used together with `JWTGuard`** (or `OptionalAuthGuard` when roles are enforced only for authenticated users).

**Behavior:**
1. Reads `ROLES_KEY` metadata from handler/class via `Reflector`.
2. If no metadata → passes (guard is a no-op).
3. Checks `authCtx` is present (falls back to `invalid-token` error if not).
4. Calls `assertRoles(authCtx, requiredRoles)`.
5. Passes if any of the listed roles matches; throws `AppError` (HTTP 403) otherwise.

```typescript
@UseGuards(JWTGuard, RolesGuard)
@RequireAnyRoles(Role.ADMIN, Role.ROOT)
```

---

#### `ApiKeyGuard`

**Use when:** Internal/metrics endpoints secured by a shared secret header rather than JWT.

**Behavior:**
1. Reads `x-api-key` header (handles both string and string[] header forms).
2. Calls `ValidateApiKeyUseCase.execute(apiKey)`.
3. Passes or throws `AppError` (HTTP 401 `auth.invalid-api-key`).

```typescript
@UseGuards(ApiKeyGuard)
```

---

### Parameter Decorators

#### `@AuthContext()`

Returns the full `AuthCtx` aggregate. Throws `AppError('auth.invalid-token')` if guard did not set `authCtx`.

```typescript
@Get('profile')
@UseGuards(JWTGuard)
getProfile(@AuthContext() authCtx: AuthCtx) { ... }
```

---

#### `@AuthContextUser()`

Returns the loaded `User` from `authCtx`. Throws `AppError('auth.require-user')` if `authCtx` has no user.

Optionally accepts a field key to extract a single property:

```typescript
@AuthContextUser() user: User
@AuthContextUser('id') userId: string
@AuthContextUser('roles') roles: Role[]
```

---

#### `@OptionalAuthContext()`

Returns `AuthCtx | undefined`. Safe to use with `OptionalAuthGuard`. Never throws.

```typescript
@Get('feed')
@UseGuards(OptionalAuthGuard)
getFeed(@OptionalAuthContext() authCtx: AuthCtx | undefined) { ... }
```

---

#### `@RequireAnyRoles(...roles)`

Class/method decorator (sets NestJS metadata). Not a guard itself — consumed by `RolesGuard`.

```typescript
@RequireAnyRoles(Role.ADMIN)
// → sets metadata key 'requireAnyRoles' = [Role.ADMIN]
```

---

### `auth-error.mapper.ts`

Maps `AuthAppError` codes to `AppError` (HTTP exceptions) from `src/common/errors`:

| `AuthAppErrorCode` | HTTP mapping |
|---|---|
| `invalid-token` | `createCommonError('auth.invalid-token')` |
| `invalid-api-key` | `createCommonError('auth.invalid-api-key')` |
| `require-user` | `createCommonError('auth.require-user')` |
| `require-person` | `createCommonError('auth.require-person')` |
| `no-privilege` | `createCommonError('auth.no-privilege', params)` |
| `server-error` | `createCommonError('server.error')` |

```typescript
export function mapAuthAppError(error: AuthAppError): AppError
export function rethrowAsAppError(error: unknown): never
// rethrowAsAppError: if AuthAppError → map and throw; otherwise re-throw as-is
```

---

## Module Wiring (`AuthModule`)

**File:** `auth.module.ts`

The module is decorated `@Global()`, meaning it is available application-wide without being imported by individual feature modules.

**Registered in:** `CommonModule` → `AppModule`.

**DI bindings summary:**

```
AUTH_TOKEN_PORT          → JwtAuthTokenAdapter
EXPECTED_API_KEY_PORT    → ConfigExpectedApiKeyAdapter
USER_LOOKUP_PORT         → PrismaUserLookupAdapter
AUTH_CTX_CACHE_PORT      → CacheManagerAuthCtxCacheAdapter
CACHE_POLICY_PORT        → ConfigCachePolicyAdapter
JWT_AUTH_TOKEN_SETTINGS  → factory: { shouldVerifyToken, jwtSecret } from ConfigService
RESOLVE_AUTH_CTX_USE_CASE → factory: new ResolveAuthCtxUseCase(...)
VALIDATE_API_KEY_USE_CASE → factory: new ValidateApiKeyUseCase(...)
```

Guards (`JWTGuard`, `OptionalAuthGuard`, `RolesGuard`, `ApiKeyGuard`) are both **provided** and **exported** so they can be injected by controllers via `@UseGuards()`.

**Imports:** `AppConfigModule`, `JwtModule` (for `JwtService`).

---

## Configuration & Environment Variables

All configuration is loaded via `src/common/configuration/configuration.ts` and accessed via `ConfigService`.

| Environment variable | Config path | Default | Used by |
|---|---|---|---|
| `VERIFY_TOKEN=true` | `security.shouldVerifyToken` | `false` | `JwtAuthTokenAdapter` — enable full JWT verification |
| `JWT_SECRET` | `security.jwtSecret` | `''` | `JwtAuthTokenAdapter` — signing secret |
| `METRICS_API_KEY` | `security.metrics.apiKey` | `''` | `ConfigExpectedApiKeyAdapter` |
| `AUTH_CACHE_DEFAULT_TTL_MS` | `auth.cacheDefaultTtlMs` | `900000` (15 min) | `ConfigCachePolicyAdapter` |
| `AUTH_CACHE_MAX_TTL_MS` | `auth.cacheMaxTtlMs` | `3600000` (1 hour) | `ConfigCachePolicyAdapter` |
| `REDIS_URL` | `redis.url` | `redis://localhost:6379/0` | `CacheModule` (Keyv+Redis) used by cache adapter |

**Important:** `VERIFY_TOKEN=false` (default) means tokens are decoded without signature verification. **Always set `VERIFY_TOKEN=true` in production.**

---

## Complete Request Flow

### JWT Protected Route

```
HTTP Request: GET /identity/users/me
  Authorization: Bearer eyJhbGc...

  1. JWTGuard.canActivate()
     ├─ extractBearerToken() → "eyJhbGc..."
     └─ resolveAuthCtx.execute("eyJhbGc...")
           │
           ├─ 2. CacheManagerAuthCtxCacheAdapter.getByToken()
           │      key = "authCtx:<jwt-signature>"
           │      Redis HIT → return cached AuthCtx (skip steps 3-6)
           │
           ├─ 3. JwtAuthTokenAdapter.resolvePayload()
           │      decode/verify → TokenPayload { sub, email, phone, exp }
           │
           ├─ 4. PrismaUserLookupAdapter.findByAuthId(sub)
           │      SELECT * FROM users WHERE auth_id = sub → User | undefined
           │
           ├─ 5. AuthCtx.forPerson(person, user, exp)
           │
           └─ 6. CacheManagerAuthCtxCacheAdapter.setByToken()
                  key = "authCtx:<jwt-signature>", ttlMs = min(remaining exp, maxTtl)

  7. request.authCtx = authCtx
  8. Controller handler called
  9. @AuthContext() injects authCtx
 10. @AuthContextUser() extracts user from authCtx
```

### Role-Protected Route

```
HTTP Request: DELETE /identity/users/:id
  Authorization: Bearer eyJhbGc...

  1. JWTGuard → resolves authCtx (as above)
  2. RolesGuard.canActivate()
     ├─ reflector.getAllAndOverride(ROLES_KEY) → [Role.ADMIN, Role.ROOT]
     ├─ authCtx.assertHasAnyRole([ADMIN, ROOT])
     │    → user.roles.includes(ADMIN or ROOT) ? pass : throw AuthDomainError
     └─ authCtxFacade.assertRoles() maps to AuthAppError → mapAuthAppError → AppError 403
```

### Optional Auth Route

```
HTTP Request: GET /feed
  (no Authorization header)

  1. OptionalAuthGuard.canActivate()
     ├─ no Bearer token → return true immediately
  2. request.authCtx = undefined
  3. @OptionalAuthContext() → undefined (no error)
```

---

## Usage Patterns in Controllers

### Standard authenticated endpoint

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, AuthContext, AuthContextUser, RequireAnyRoles } from 'src/common/auth';
import { AuthCtx, User, Role } from 'src/common/auth';

@Controller('example')
@UseGuards(AuthGuard, RolesGuard)
export class ExampleController {

  @Get('me')
  getMe(@AuthContextUser() user: User) {
    return user;
  }

  @Get('admin')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  getAdmin(@AuthContext() authCtx: AuthCtx) {
    return authCtx.getUser();
  }
}
```

---

### Endpoint with optional authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard, OptionalAuthContext } from 'src/common/auth';
import { AuthCtx } from 'src/common/auth';

@Controller('feed')
export class FeedController {

  @Get()
  @UseGuards(OptionalAuthGuard)
  getFeed(@OptionalAuthContext() authCtx: AuthCtx | undefined) {
    if (authCtx?.isUser()) {
      return this.getPersonalizedFeed(authCtx.getUser());
    }
    return this.getPublicFeed();
  }
}
```

---

### Metrics/internal endpoint with API key

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/auth';

@Controller('metrics')
@UseGuards(ApiKeyGuard)
export class MetricsController {

  @Get()
  getMetrics() {
    return { status: 'ok' };
  }
}
```

---

### Extracting a specific user field

```typescript
@Get('avatar')
@UseGuards(AuthGuard)
getAvatar(@AuthContextUser('avatar') avatar: string | null) {
  return { avatar };
}
```

---

## Error Handling Chain

```
AuthCtx method throws    →  AuthDomainError  (domain)
                                    ↓
AuthCtxFacade catches    →  AuthAppError     (application)
                                    ↓
Guard/Decorator catches  →  mapAuthAppError  →  AppError (HTTP exception)
                                    ↓
NestJS exception filter  →  HTTP response { code, message, statusCode }
```

| Scenario | Error thrown | HTTP status |
|---|---|---|
| No / invalid Bearer token | `auth.invalid-token` | 401 |
| Invalid `x-api-key` | `auth.invalid-api-key` | 401 |
| Valid token but no DB user | `auth.require-user` | 401 |
| Valid token but not a person | `auth.require-person` | 401 |
| Authenticated but wrong role | `auth.no-privilege` | 403 |
| Unexpected infrastructure failure | `server.error` | 500 |

---

## Caching Strategy

**Store:** Redis via `@nestjs/cache-manager` with `@keyv/redis` store (configured globally in `CommonModule`).

**Cache key:** `authCtx:<jwt-signature>` — the third JWT segment (signature) only. This means two tokens with the same signature (same payload + secret) share the same cache entry.

**What is cached:** `AuthCtxSnapshot` (plain serializable object — the output of `authCtx.toSnapshot()`).

**What is NOT cached:**
- Tokens without a loaded DB `User` (person agent only, no match in users table).
- Tokens with TTL ≤ 0 ms.

**TTL logic:**
```
if (JWT has exp claim):
    ttl = exp_unix_sec * 1000 - Date.now()   # remaining token lifetime
else:
    ttl = cacheDefaultTtlMs                   # 15 min default
ttl = max(0, min(ttl, cacheMaxTtlMs))         # cap to 1 hour
```

**Cache invalidation:** Not explicitly supported. Tokens are cached until their TTL expires. Revoking a token requires Redis key deletion or waiting for natural expiry.

---

## Public Barrel Exports

### `src/common/auth/index.ts` (top-level)

```typescript
// Domain types
export { AuthCtx, Role, type User, type Person } from './domain';

// NestJS presentation
export {
  AuthContext,        // param decorator → AuthCtx (throws if absent)
  AuthContextUser,    // param decorator → User (or User field)
  OptionalAuthContext,// param decorator → AuthCtx | undefined
  RequireAnyRoles,    // class/method decorator → sets roles metadata
  JWTGuard,           // guard → requires valid JWT
  AuthGuard,          // alias for JWTGuard
  OptionalAuthGuard,  // guard → optional JWT
  RolesGuard,         // guard → checks @RequireAnyRoles metadata
  ApiKeyGuard,        // guard → x-api-key header
} from './adapter/presentation/nestjs';
```

### `src/common/auth/application/index.ts`

```typescript
export { type TokenPayload }
export { extractUser, extractPerson, assertRoles }   // facade helpers
export { AuthAppError, type AuthAppErrorCode }
export { AUTH_CTX_CACHE_PORT, type AuthCtxCachePort }
export { AUTH_TOKEN_PORT, type AuthTokenPort }
export { CACHE_POLICY_PORT, type CachePolicyPort }
export { EXPECTED_API_KEY_PORT, type ExpectedApiKeyPort }
export { RESOLVE_AUTH_CTX_USE_CASE, type IResolveAuthCtxUseCase }
export { USER_LOOKUP_PORT, type UserLookupPort }
export { VALIDATE_API_KEY_USE_CASE, type IValidateApiKeyUseCase }
```

### `src/common/index.ts`

Re-exports `src/common/auth` — so features can import directly from `src/common`.

---

## Test Coverage Map

All 57 files under `src/common/auth` include `*.spec.ts` counterparts for every non-trivial unit:

| Layer | Test file | Key scenarios |
|---|---|---|
| Domain | `auth-ctx.model.spec.ts` | Factory methods, snapshot round-trip, `requireUser`, `requirePerson`, `assertHasAnyRole` |
| Domain | `auth-domain-error.spec.ts` | Error shape, name, code, params |
| Application | `auth-app-error.spec.ts` | Error shape, cause chaining |
| Application | `auth-ctx-facade.spec.ts` | All three helpers, domain-to-app error translation |
| Application | `resolve-auth-ctx.use-case.spec.ts` | Cache hit, cache miss + DB hit, no user (no cache), TTL capping, error wrapping |
| Application | `validate-api-key.use-case.spec.ts` | Match, mismatch, undefined key |
| Infra | `jwt-auth-token.adapter.spec.ts` | Decode path, verify path, invalid payload, missing sub |
| Infra | `cache-manager-auth-ctx-cache.adapter.spec.ts` | Get (hit/miss/invalid), set, key construction |
| Infra | `config-cache-policy.adapter.spec.ts` | Default TTLs, overridden TTLs |
| Infra | `config-expected-api-key.adapter.spec.ts` | API key from config |
| Infra | `prisma-user-lookup.adapter.spec.ts` | Found user mapping, not found → undefined |
| Presentation | `jwt.guard.spec.ts` | No header → 401, valid → authCtx set, AppError thrown |
| Presentation | `optional-auth.guard.spec.ts` | No header → pass, valid → set, invalid-token → silently pass |
| Presentation | `role.guard.spec.ts` | No metadata → pass, roles match, roles fail → 403 |
| Presentation | `api-key.guard.spec.ts` | String header, array header, missing → 401 |
| Presentation | `auth-error.mapper.spec.ts` | All 6 error codes mapped correctly |
| Decorators | `auth-context.decorator.spec.ts` | Present → return, absent → throw |
| Decorators | `auth-context-user.decorator.spec.ts` | Full user, field extraction, no user |
| Decorators | `optional-auth-context.decorator.spec.ts` | Present → return, absent → undefined |
| Decorators | `require-any-roles.decorator.spec.ts` | Metadata set with correct key and roles |
