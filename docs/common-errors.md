# `src/common/errors` — Errors Module

> **Context document for AI-assisted code generation.**
> Covers purpose, architecture, `AppError`, `GlobalErrorFilter`, all error codes, `@ErrorResponse()` decorator, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Error Response Shape](#error-response-shape)
6. [All Common Error Codes](#all-common-error-codes)
7. [Usage Patterns](#usage-patterns)
8. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

`src/common/errors` is the **application-wide error infrastructure**. It provides:

- `AppError` — the canonical HTTP-aware error class used throughout all layers.
- `GlobalErrorFilter` — a NestJS exception filter that catches every unhandled exception and serializes it into a consistent JSON response.
- `COMMON_ERRORS` — a registry of named error definitions (code → `{ message, status }`).
- `createCommonError()` — factory helper to instantiate `AppError` from the registry by code string.
- `@ErrorResponse()` — a Swagger decorator that documents error responses on controller endpoints.

> **Note on `src/common/models/AppError.ts`:** There is a **legacy** `AppError` class at `src/common/models/AppError.ts`. It has a different signature (`name`, `msgParams`) and should not be used in new code. The canonical implementation is `src/common/errors/app.error.ts`. See [models documentation](./common-models.md) for details.

---

## Architecture Overview

```
Any layer (guard, use-case, service, controller)
      │ throws AppError (code, definition, options)
      ▼
GlobalErrorFilter.catch()
      ├─ AppError   → response.status(error.status).json(error.toJSON())
      ├─ HttpException → response.status(status).json({ code: 'http.error', ... })
      └─ unknown    → response.status(500).json({ code: 'internal.error', ... })
```

Error creation flow:

```
COMMON_ERRORS['auth.invalid-token']        // ErrorDefinition: { message, status }
      │
createCommonError('auth.invalid-token')
      │
new AppError(code, definition, options)    // formats message, attaches params/cause/timestamp
      │
thrown by guard/service
      │
caught by GlobalErrorFilter
      │
HTTP JSON response
```

---

## Folder Structure

```
src/common/errors/
├── app.error.ts                       AppError class + ErrorDefinition interface
├── common.errors.ts                   COMMON_ERRORS registry + createCommonError()
├── error.filter.ts                    GlobalErrorFilter (@Catch())
├── error.module.ts                    @Global() ErrorModule
├── index.ts                           Barrel export
└── decorators/
    └── error-response.decorator.ts    @ErrorResponse() Swagger decorator
```

---

## Files

### `app.error.ts`

#### `ErrorDefinition`

```typescript
interface ErrorDefinition {
  message: string;        // Human-readable message template (supports {param} interpolation)
  status: HttpStatus;     // HTTP status code
}
```

#### `ErrorOptions`

```typescript
interface ErrorOptions {
  params?: Record<string, unknown>;  // Values for {placeholder} substitution in message
  cause?: Error;                     // Original error for chaining
}
```

#### `AppError`

```typescript
class AppError extends Error {
  readonly code: string;                    // Machine-readable error code (e.g. 'auth.invalid-token')
  readonly status: HttpStatus;              // HTTP status (from ErrorDefinition)
  readonly params: Record<string, unknown>; // Interpolation params (default {})
  readonly cause?: Error;                   // Wrapped cause
  readonly timestamp: Date;                 // Creation time (UTC)
}
```

**Constructor:** `new AppError(code, definition, options?)`

- `message` is formatted by replacing `{key}` placeholders with values from `options.params`.
- Example: `'Required one of the following roles: {roles}'` with `{ roles: 'ADMIN, ROOT' }` → `'Required one of the following roles: ADMIN, ROOT'`.
- If a param key is missing → placeholder is kept as-is (`'{key}'`).
- `Error.captureStackTrace` is called for clean stack traces.

**`toJSON()`** — Returns a serializable object for HTTP responses and logging:

```typescript
{
  code: string;
  message: string;
  params: Record<string, unknown>;
  timestamp: string;  // ISO 8601
}
```

---

### `common.errors.ts`

#### `COMMON_ERRORS`

Central registry of all shared error definitions. Typed as `Record<string, ErrorDefinition>` via `satisfies`.

```typescript
const COMMON_ERRORS = {
  // Server
  'server.error':         { message: 'Internal server error',                       status: 500 },

  // Authentication
  'auth.invalid-token':   { message: 'Access token has expired or is not valid',    status: 401 },
  'auth.invalid-api-key': { message: 'Invalid or missing API key',                  status: 401 },
  'auth.no-privilege':    { message: 'Required one of the following roles: {roles}', status: 403 },
  'auth.forbidden':       { message: 'Forbidden',                                   status: 403 },
  'auth.require-person':  { message: 'Agent must be a person',                      status: 403 },
  'auth.require-user':    { message: 'Agent must be a user',                        status: 403 },
}
```

#### `COMMON_PUBLIC_ERRORS`

A subset of `COMMON_ERRORS` containing only errors that are safe to expose to public clients. Currently contains only `'server.error'`.

#### `CommonErrorCode`

```typescript
type CommonErrorCode = keyof typeof COMMON_ERRORS;
// = 'server.error' | 'auth.invalid-token' | 'auth.invalid-api-key'
//   | 'auth.no-privilege' | 'auth.forbidden' | 'auth.require-person' | 'auth.require-user'
```

#### `CommonPublicErrorCode`

```typescript
type CommonPublicErrorCode = keyof typeof COMMON_PUBLIC_ERRORS;
// = 'server.error'
```

#### `createCommonError()`

```typescript
function createCommonError(
  code: CommonErrorCode,
  params?: Record<string, unknown>,
): AppError
```

Creates an `AppError` from the common registry. Used everywhere an auth/server error needs to be thrown:

```typescript
createCommonError('auth.invalid-token')
// → new AppError('auth.invalid-token', { message: '...', status: 401 })

createCommonError('auth.no-privilege', { roles: 'ADMIN, ROOT' })
// → new AppError('auth.no-privilege', { message: 'Required one of the following roles: ADMIN, ROOT', status: 403 })
```

---

### `error.filter.ts`

#### `GlobalErrorFilter`

`@Catch()` — catches all exceptions application-wide.

**Priority order:**

1. **`AppError`** → logs `error.message` + `error.toJSON()`, responds with `error.status` + `error.toJSON()`.
2. **`HttpException`** (NestJS built-in) → logs message + status, responds with:
   ```json
   {
     "code": "http.error",
     "message": "...",
     "params": { "..." },
     "timestamp": "..."
   }
   ```
3. **Unknown** → logs full stack trace, responds with HTTP 500:
   ```json
   {
     "code": "internal.error",
     "message": "Internal server error",
     "timestamp": "..."
   }
   ```

Registration in `main.ts` (recommended pattern):

```typescript
const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new GlobalErrorFilter());
```

Or via `ErrorModule` which provides and exports the filter.

---

### `error.module.ts`

```typescript
@Global()
@Module({
  providers: [GlobalErrorFilter],
  exports: [GlobalErrorFilter],
})
export class ErrorModule {}
```

`@Global()` — makes `GlobalErrorFilter` available for injection globally. Import `ErrorModule` in `AppModule` to register the filter.

---

### `decorators/error-response.decorator.ts`

#### `@ErrorResponse(errors, options?)`

A Swagger meta-decorator that generates `@ApiResponse` decorators grouped by HTTP status code. Accepts any `Record<string, ErrorDefinition>` (including module-specific error maps).

```typescript
function ErrorResponse(
  errors: Record<string, ErrorDefinition>,
  options?: {
    description?: string;
    example?: Record<string, unknown>;
  },
): MethodDecorator & ClassDecorator
```

**How it works:**
1. Groups all entries from `errors` by their `status` code.
2. For each unique status → emits an `@ApiResponse({ status, content: { 'application/json': { examples, schema } } })`.
3. Each error code in the group becomes an OpenAPI `example` entry showing the full JSON response shape.

**Usage:**

```typescript
import { ErrorResponse } from 'src/common/errors';
import { COMMON_ERRORS } from 'src/common/errors';

@Get(':id')
@ErrorResponse({
  'auth.invalid-token': COMMON_ERRORS['auth.invalid-token'],
  'auth.no-privilege': COMMON_ERRORS['auth.no-privilege'],
})
findOne(@Param('id') id: string) { ... }
```

For module-specific errors, pass the module's own error map:

```typescript
@Post()
@ErrorResponse(MY_MODULE_ERRORS)
create(@Body() dto: CreateDto) { ... }
```

---

## Error Response Shape

All error responses from the API (regardless of error type) follow this JSON shape:

```json
{
  "code": "auth.invalid-token",
  "message": "Access token has expired or is not valid",
  "params": {},
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Machine-readable error code for programmatic handling |
| `message` | `string` | Human-readable error message (may contain interpolated values) |
| `params` | `object` | Parameters that were interpolated into the message |
| `timestamp` | `string` | ISO 8601 timestamp when the error was created |

---

## All Common Error Codes

| Code | HTTP Status | Message |
|---|---|---|
| `server.error` | 500 | Internal server error |
| `auth.invalid-token` | 401 | Access token has expired or is not valid |
| `auth.invalid-api-key` | 401 | Invalid or missing API key |
| `auth.no-privilege` | 403 | Required one of the following roles: `{roles}` |
| `auth.forbidden` | 403 | Forbidden |
| `auth.require-person` | 403 | Agent must be a person |
| `auth.require-user` | 403 | Agent must be a user |

Feature modules define their own additional error codes in their own error maps (not part of this module). They use `AppError` and `ErrorDefinition` from this module as the base.

---

## Usage Patterns

### Defining module-specific errors

```typescript
import { AppError, ErrorDefinition } from 'src/common/errors';
import { HttpStatus } from '@nestjs/common';

export const USER_ERRORS = {
  'user.not-found': {
    message: 'User with id {id} not found',
    status: HttpStatus.NOT_FOUND,
  },
  'user.already-exists': {
    message: 'User with email {email} already exists',
    status: HttpStatus.CONFLICT,
  },
} as const satisfies Record<string, ErrorDefinition>;

export function createUserError(
  code: keyof typeof USER_ERRORS,
  params?: Record<string, unknown>,
): AppError {
  return new AppError(code, USER_ERRORS[code], { params });
}
```

### Throwing an error in a service

```typescript
import { createUserError } from './user.errors';
import { createCommonError } from 'src/common/errors';

async findUser(id: string): Promise<User> {
  const user = await this.prismaService.client.user.findUnique({ where: { id } });
  if (!user) {
    throw createUserError('user.not-found', { id });
  }
  return user;
}
```

### Documenting errors in a controller

```typescript
import { ErrorResponse } from 'src/common/errors';
import { COMMON_ERRORS } from 'src/common/errors';
import { USER_ERRORS } from './user.errors';

@Get(':id')
@ErrorResponse({
  ...COMMON_ERRORS,
  ...USER_ERRORS,
}, { description: 'Error responses for GET /users/:id' })
async findOne(@Param('id') id: string): Promise<UserDto> {
  return this.userService.findUser(id);
}
```

### Wrapping an unexpected error with cause

```typescript
try {
  await externalService.call();
} catch (err) {
  throw new AppError(
    'server.error',
    COMMON_ERRORS['server.error'],
    { cause: err instanceof Error ? err : undefined },
  );
}
```

---

## Public Barrel Exports

From `src/common/errors/index.ts`:

```typescript
export * from './app.error';       // AppError, ErrorDefinition, ErrorOptions
export * from './error.filter';    // GlobalErrorFilter
export * from './common.errors';   // COMMON_ERRORS, COMMON_PUBLIC_ERRORS, CommonErrorCode,
                                   // CommonPublicErrorCode, createCommonError
export * from './decorators/error-response.decorator';  // ErrorResponse, ErrorResponseOptions
```

From `src/common/index.ts` — **not re-exported** (errors module not included in the top-level common barrel). Import directly:

```typescript
import { AppError, createCommonError, ErrorResponse, COMMON_ERRORS } from 'src/common/errors';
```

---

## Test Coverage Map

| Spec file | Source file | What is tested |
|---|---|---|
| `errors/app.error.spec.ts` | `errors/app.error.ts` | Constructor sets `code`, `status`, `name`, `timestamp`; default `params={}` and `cause=undefined`; stores `params` and `cause` when provided; `{param}` placeholder interpolation in message; missing placeholder left as-is; `toJSON` shape; `instanceof Error`; has `stack` |
| `errors/error.filter.spec.ts` | `errors/error.filter.ts` | `AppError` branch → correct `status` + JSON body with `code/message/params/timestamp`; `HttpException` branch → `code: 'http.error'`, object response spread into `params`, string response wrapped in `params.message`; unknown error → 500 + `code: 'internal.error'`; all branches include ISO timestamp |
| `errors/common.errors.spec.ts` | `errors/common.errors.ts` | All `COMMON_ERRORS` entries have `message` (string) and `status` (number); required codes present; `COMMON_PUBLIC_ERRORS.server.error` structure; `createCommonError` returns `AppError`, sets correct code/status, replaces `{roles}` placeholder, stores `params` |
| `errors/decorators/error-response.decorator.spec.ts` | `errors/decorators/error-response.decorator.ts` | Returns a decorator function; groups errors by status → one `ApiResponse` per status; multiple same-status errors → all in `examples`; example value includes `code`, `message`, `timestamp`; uses provided `description` option |

**Coverage achieved:** 100 % statements · 100 % functions · 100 % lines · 100 % branches.
