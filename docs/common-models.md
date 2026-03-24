# `src/common/models` — Shared Domain Models

> **Context document for AI-assisted code generation.**
> Covers purpose, all types and classes (`PagedResult`, `AppResult`, `OrderDirection`, `AppError` legacy, `ErrorMap`), and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Legacy vs Current AppError](#legacy-vs-current-apperror)
6. [Usage Patterns](#usage-patterns)
7. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

`src/common/models` contains **shared value types and utility classes** used across feature modules:

- `PagedResult<T>` + `PageMeta` — standardized pagination response container with Swagger decorators.
- `AppResult<T, K>` — Result type (discriminated union) for explicit error handling without exceptions.
- `OrderDirection` — enum for sorting direction used in repository queries.
- `AppError` (legacy) — the original, simpler error class. **Do not use in new code.**
- `ErrorMap` / `commonErrorMap` — legacy typed error map structure. **Do not use in new code.**

---

## Architecture Overview

These are **plain TypeScript types and classes** with no NestJS DI dependencies. They can be imported anywhere without module registration.

```
Controller / Service / Repository
      │
      │ returns PagedResult<Dto>
      │ returns AppResult<T>
      │ uses OrderDirection in query params
      ▼
   Consumed by caller
```

---

## Folder Structure

```
src/common/models/
├── AppError.ts            Legacy AppError class
├── AppResult.ts           AppResult<T, K> discriminated union
├── error.map.ts           Legacy ErrorMap type + commonErrorMap
├── index.ts               Barrel export
├── order-direction.enum.ts OrderDirection enum
└── PagedResult.ts         PagedResult<T> + PageMeta classes
```

---

## Files

### `PagedResult.ts`

#### `PageMeta`

A Swagger-documented class holding pagination state:

```typescript
class PageMeta {
  pageSize: number;       // Items per page
  pageNumber: number;     // Current page (0-based)
  totalItems: number;     // Total items in the dataset
  totalPages: number;     // Math.ceil(totalItems / pageSize)
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

All fields have `@ApiProperty` decorators with examples.

#### `PagedResult<T>`

The standard paginated response wrapper used by all list endpoints:

```typescript
class PagedResult<T> {
  data: T[];
  meta: PageMeta;

  constructor(data: T[], meta: PageMeta)
}
```

**Static methods:**

**`static empty<T>(): PagedResult<T>`**

Returns an empty result with zeroed-out meta:
```typescript
PagedResult.empty<UserDto>()
// → { data: [], meta: { pageSize: 0, pageNumber: 0, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
```

**`static transform<T, U>(pagedResult: PagedResult<T>, transformer: (item: T) => U): PagedResult<U>`**

Maps `data` through a transformer while preserving `meta`:
```typescript
PagedResult.transform(domainPagedResult, (user) => UserDto.fromDomain(user))
```

---

### `AppResult.ts`

A Result type (inspired by Rust/fp-ts) for explicit error handling. Avoids throwing exceptions in places where failures are expected.

```typescript
interface SuccessResult<T> {
  err?: never;
  data: T;
}

interface FailResult<K> {
  err: K;
  data?: never;
}

type AppResult<T, K = AppError> = SuccessResult<T> | FailResult<K>;
```

Discriminated by the presence of `err` vs `data`:
- `SuccessResult` — `data` is defined, `err` is `never`.
- `FailResult` — `err` is defined, `data` is `never`.

**Pattern:**
```typescript
function processResult<T>(result: AppResult<T>): T {
  if (result.err) {
    // TypeScript knows result.err is K here
    throw new Error(result.err.message);
  }
  return result.data;  // TypeScript knows result.data is T here
}
```

> The default generic `K = AppError` references `src/common/models/AppError.ts` (the legacy class). When using `AppResult` with the newer error system, explicitly type `K` as `import('src/common/errors').AppError`.

---

### `OrderDirection`

```typescript
enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
```

Used in query DTOs and repository calls for specifying sort direction. Values are lowercase to match Prisma's `SortOrder` type.

---

### `AppError.ts` — Legacy

> **Do not use in new code.** Use `src/common/errors/app.error.ts` instead.

```typescript
class AppError extends Error {
  name: string;
  msgParams: Record<string, string | number | boolean>;

  constructor(name: string, msgParams?: Record<string, string | number | boolean>)
}
```

This class predates the current error architecture. It has no HTTP status code, no error code registry, and no `toJSON()` method. It exists only for backward compatibility with `AppResult`'s default type parameter and legacy code.

---

### `error.map.ts` — Legacy

> **Do not use in new code.** Use `src/common/errors/common.errors.ts` instead.

```typescript
type ErrorMapType = {
  [key: string]: { status: HttpStatus; message: string } | ErrorMapType;
}

type ErrorMap = {
  [key: string]: ErrorMapType;
}

const commonErrorMap: ErrorMap = {
  common: {
    serverError:     { status: 500, message: 'Internal server error' },
    invalidToken:    { status: 401, message: 'Access token has expired or is not valid' },
    invalidApiKey:   { status: 401, message: 'Invalid or missing API key' },
    noPrivilege:     { status: 403, message: 'Required one of the following roles: [{{roles}}]' },
    forbidden:       { status: 403, message: 'Forbidden' },
    requirePerson:   { status: 403, message: 'Agent must be a person' },
    requireUser:     { status: 403, message: 'Agent must be a user' },
  },
  validation: {
    validationFailed: { status: 400, message: 'Validation failed...' },
  },
}
```

Used by `RestResponse.error()` (also legacy) to look up error definitions by dot-notation key.

---

### `index.ts`

```typescript
export { AppError } from './AppError';
export { PagedResult, PageMeta as PaginationInfo } from './PagedResult';
export type { AppResult, SuccessResult, FailResult } from './AppResult';
export type { commonErrorMap, ErrorMap } from './error.map';
export { OrderDirection } from './order-direction.enum';
```

> Note: `PageMeta` is re-exported as `PaginationInfo` from this barrel. When importing from `src/common/models`, use `PaginationInfo`. When importing directly from the file path, use `PageMeta`.

---

## Legacy vs Current `AppError`

| | `src/common/models/AppError.ts` (legacy) | `src/common/errors/app.error.ts` (current) |
|---|---|---|
| HTTP status | ✗ Not supported | ✓ `readonly status: HttpStatus` |
| Error code | `name` (informal) | `readonly code: string` (formal) |
| Message params | `msgParams` | `readonly params` |
| Error chaining | ✗ No `cause` | ✓ `readonly cause?: Error` |
| Timestamp | ✗ None | ✓ `readonly timestamp: Date` |
| `toJSON()` | ✗ None | ✓ Serializable for HTTP response |
| Registry | ✗ None | ✓ `COMMON_ERRORS` + `createCommonError()` |
| Use in new code | ✗ Do not use | ✓ Use this |

---

## Usage Patterns

### Building a paginated service response

```typescript
import { PagedResult } from 'src/common/models';
import { PageOptionsDto } from 'src/common/presentation';

async findUsers(options: PageOptionsDto): Promise<PagedResult<UserDto>> {
  const { skip, take } = options.toDatabaseQuery();

  const [users, totalItems] = await Promise.all([
    this.prismaService.client.user.findMany({ skip, take }),
    this.prismaService.client.user.count(),
  ]);

  const meta = options.toResponseMeta(totalItems);
  const data = users.map(UserDto.fromDomain);

  return new PagedResult(data, meta);
}
```

### Transforming a paginated domain result to DTOs

```typescript
const domainResult: PagedResult<User> = await this.userService.findAll(options);
const dtoResult: PagedResult<UserDto> = PagedResult.transform(domainResult, UserDto.fromDomain);
return dtoResult;
```

### Returning an empty result on no data

```typescript
if (!hasData) {
  return PagedResult.empty<UserDto>();
}
```

### Using `AppResult` for explicit error handling

```typescript
import { AppResult } from 'src/common/models';
import { AppError } from 'src/common/errors';

async findUser(id: string): Promise<AppResult<User, AppError>> {
  const user = await this.prismaService.client.user.findUnique({ where: { id } });
  if (!user) {
    return { err: createUserError('user.not-found', { id }) };
  }
  return { data: user };
}

// Caller:
const result = await this.findUser(id);
if (result.err) {
  throw result.err;
}
return result.data;
```

### Using `OrderDirection` in a query DTO

```typescript
import { IsEnum, IsOptional } from 'class-validator';
import { OrderDirection } from 'src/common/models';

export class UserQueryDto {
  @IsOptional()
  @IsEnum(OrderDirection)
  sortDirection?: OrderDirection = OrderDirection.DESC;
}

// In repository:
const users = await prisma.user.findMany({
  orderBy: { createdAt: dto.sortDirection },
});
```

---

## Public Barrel Exports

From `src/common/models/index.ts`:

```typescript
export { AppError }           // Legacy — avoid in new code
export { PagedResult, PaginationInfo }   // PaginationInfo = PageMeta
export type { AppResult, SuccessResult, FailResult }
export type { commonErrorMap, ErrorMap } // Legacy
export { OrderDirection }
```

From `src/common/index.ts`:

```typescript
export * from './models';
// → PagedResult, PaginationInfo, AppResult, OrderDirection, etc. available from 'src/common'
```
