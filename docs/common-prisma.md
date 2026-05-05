# `src/common/prisma` — Prisma Module

> **Context document for AI-assisted code generation.**
> Covers purpose, architecture, `PrismaService`, read-replica setup, lifecycle hooks, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Read Replica Configuration](#read-replica-configuration)
6. [Environment Variables](#environment-variables)
7. [Usage Patterns](#usage-patterns)
8. [Public Barrel Exports](#public-barrel-exports)

---

## Purpose & Responsibilities

`src/common/prisma` provides the **single, global Prisma database client** for the entire application. It:

- Wraps `PrismaClient` (from `src/generated/prisma/client`) in an injectable `PrismaService`.
- Configures a **main + read-replica** Prisma client using `@prisma/adapter-pg` (pg adapter) and `@prisma/extension-read-replicas`.
- Manages connection lifecycle: connects on `OnModuleInit`, disconnects on `OnModuleDestroy`.
- Exposes `readonly client: ExtendedPrismaClient` for all database queries.

---

## Architecture Overview

```
PrismaService (constructor)
      │
      │ ConfigService.getOrThrow('database') → { master, readReplicas[] }
      │ createExtendedClient()
      │   ├─ buildConnectionString(database.master) → PrismaPg(...) → mainClient
      │   ├─ buildConnectionString(replica_i)       → PrismaPg(...) → replicaClients[]
      │   └─ mainClient.$extends(readReplicas({ replicas: replicaClients }))
      │                          → ExtendedPrismaClient
      ▼
 this.client: ExtendedPrismaClient
      │
      │ Read queries (findMany, findUnique, count, etc.)
      │   → routed to configured read replicas (by extension)
      │
      │ Write queries (create, update, delete, etc.)
      │   → routed to master database
```

`PrismaModule` is `@Global()` — `PrismaService` is available in every module without re-importing.

---

## Folder Structure

```
src/common/prisma/
├── prisma.module.ts    @Global() NestJS module
├── prisma.service.ts   PrismaService (@Injectable, OnModuleInit, OnModuleDestroy)
└── index.ts            Barrel export
```

---

## Files

### `prisma.module.ts`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Registered in `CommonModule`. Because it is `@Global()`, `PrismaService` can be injected in any module without importing `PrismaModule`.

---

### `prisma.service.ts`

#### `ExtendedPrismaClient`

A type alias for the return type of `createExtendedClient()`:

```typescript
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;
```

This type includes all standard Prisma model methods plus the `readReplicas` extension.

#### `PrismaService`

```typescript
@Injectable()
class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: ExtendedPrismaClient;

  constructor()
  async onModuleInit(): Promise<void>    // calls client.$connect()
  async onModuleDestroy(): Promise<void> // calls client.$disconnect()
}
```

**`client`** is the only public property. Always use `prismaService.client.<model>.<method>()` for queries.

**`createExtendedClient()`** (module-level factory):

```typescript
function createExtendedClient(): ExtendedPrismaClient {
  const database = this.configService.getOrThrow<DatabaseConfig>('database');
  const masterConnectionString = buildConnectionString(database.master);
  const mainAdapter = new PrismaPg({ connectionString: masterConnectionString });
  const mainClient = new PrismaClient({ adapter: mainAdapter });

  const replicaClients = (database.readReplicas ?? []).map((replica) => {
    const replicaConnectionString = buildConnectionString(replica);
    const replicaAdapter = new PrismaPg({ connectionString: replicaConnectionString });
    return new PrismaClient({ adapter: replicaAdapter });
  });

  if (replicaClients.length) {
    return mainClient.$extends(readReplicas({ replicas: replicaClients }));
  }
  return mainClient;
}
```

**Note:** Database connection settings are loaded from `ConfigService` under `database.master` and `database.readReplicas`, which are derived from `POSTGRES_*` and `READ_REPLICA{n}_POSTGRES_*` environment variables.

**Connection lifecycle:**

```typescript
async onModuleInit(): Promise<void> {
  await (this.client as unknown as PrismaClient).$connect();
  this.logger.log('prisma service: connect to database successfully');
}

async onModuleDestroy(): Promise<void> {
  await (this.client as unknown as PrismaClient).$disconnect();
}
```

The cast to `unknown as PrismaClient` is required because the `readReplicas` extension changes the type signature, but `$connect` / `$disconnect` are still available at runtime.

---

### `index.ts`

```typescript
export * from './prisma.service';
// Exports: PrismaService, ExtendedPrismaClient
```

---

## Read Replica Configuration

The `@prisma/extension-read-replicas` extension automatically routes queries:

| Operation type | Routed to |
|---|---|
| `findMany`, `findUnique`, `findFirst`, `count`, `aggregate`, `groupBy` | `database.readReplicas[]` |
| `create`, `createMany`, `update`, `updateMany`, `upsert`, `delete`, `deleteMany` | `database.master` |
| Transactions (`$transaction`) | `database.master` |

If no read replicas are configured, Prisma uses only `database.master` and all queries run against the same database (suitable for development).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_HOST` | Yes | Host for the **master** PostgreSQL node |
| `POSTGRES_PORT` | Yes | Port for the **master** PostgreSQL node |
| `POSTGRES_USER` | Yes | User for the **master** PostgreSQL node |
| `POSTGRES_PASSWORD` | Yes | Password for the **master** PostgreSQL node |
| `POSTGRES_DB` | Yes | Database name for the **master** node |
| `POSTGRES_SSLMODE` | No | SSL mode for master connection (`verify-full` by default) |
| `READ_REPLICA{n}_POSTGRES_HOST` | No | Host for read replica `n` (`n = 0, 1, 2...`) |
| `READ_REPLICA{n}_POSTGRES_PORT` | No | Port for read replica `n` |
| `READ_REPLICA{n}_POSTGRES_USER` | No | User for read replica `n` |
| `READ_REPLICA{n}_POSTGRES_PASSWORD` | No | Password for read replica `n` |
| `READ_REPLICA{n}_POSTGRES_DB` | No | Database name for read replica `n` |
| `READ_REPLICA{n}_POSTGRES_SSLMODE` | No | SSL mode for read replica `n` (`verify-full` by default) |

`PrismaService` assembles PostgreSQL URLs from these variables for `@prisma/adapter-pg`. Resulting format:

```
postgres://user:password@host:5432/database?sslmode=verify-full
```

---

## Usage Patterns

### Injecting and using `PrismaService`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string) {
    return this.prismaService.client.user.findUnique({
      where: { id },
    });
  }

  async findAll({ skip, take }: { skip: number; take: number }) {
    return this.prismaService.client.user.findMany({ skip, take });
  }

  async create(data: CreateUserData) {
    return this.prismaService.client.user.create({ data });
  }

  async update(id: string, data: UpdateUserData) {
    return this.prismaService.client.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prismaService.client.user.delete({ where: { id } });
  }
}
```

### Using transactions

```typescript
async transferFunds(fromId: string, toId: string, amount: number): Promise<void> {
  await this.prismaService.client.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}
```

### Counting with pagination

```typescript
async findAllWithCount(options: { skip: number; take: number }) {
  const [items, total] = await Promise.all([
    this.prismaService.client.user.findMany(options),
    this.prismaService.client.user.count(),
  ]);
  return { items, total };
}
```

### Accessing the Prisma schema models

The generated Prisma client is at `src/generated/prisma/client`. Available models match the `prisma/schema.prisma` file. Key models relevant to authentication and identity:

| Prisma model | Access via | Key fields |
|---|---|---|
| `User` | `prismaService.client.user` | `id`, `authId`, `email`, `phone`, `firstName`, `lastName`, `roles`, `isActive` |
| `Credentials` | `prismaService.client.credentials` | `id`, `authId`, `passwordHash`, `isVerified` |
| `RefreshToken` | `prismaService.client.refreshToken` | `id`, `tokenHash`, `credentialsId`, `expiresAt` |
| `PasswordResetToken` | `prismaService.client.passwordResetToken` | `id`, `tokenHash`, `credentialsId`, `expiresAt` |
| `EmailVerificationToken` | `prismaService.client.emailVerificationToken` | `id`, `tokenHash`, `credentialsId`, `expiresAt` |

---

## Public Barrel Exports

From `src/common/prisma/index.ts`:

```typescript
export * from './prisma.service';
// → PrismaService, ExtendedPrismaClient
```

From `src/common/index.ts`:

```typescript
export * from './prisma';
// → PrismaService, ExtendedPrismaClient available from 'src/common'
```

Import path:

```typescript
import { PrismaService } from 'src/common/prisma';
// or
import { PrismaService } from 'src/common';
```

---

## Test Coverage Map

| Spec file | Source file | What is tested |
|---|---|---|
| `prisma/prisma.service.spec.ts` | `prisma/prisma.service.ts` | Constructor creates `client` property (via mocked `PrismaPg`, `readReplicas`, `PrismaClient`); `onModuleInit()` calls `$connect`; `onModuleDestroy()` calls `$disconnect` |

**Coverage achieved:** 100 % statements · 100 % functions · 100 % lines · 100 % branches.

> **Note on mocking strategy:** `@prisma/adapter-pg`, `@prisma/extension-read-replicas`, and `src/generated/prisma/client` are all mocked at the top of the spec file using `jest.mock(...)` factories to avoid actual database connections during unit tests.
