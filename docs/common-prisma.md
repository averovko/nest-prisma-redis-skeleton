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
      │ createExtendedClient()
      │   ├─ PrismaPg(DATABASE_URL) → mainClient
      │   ├─ PrismaPg(REPLICA_URL)  → replicaClient
      │   └─ mainClient.$extends(readReplicas({ replicas: [replicaClient] }))
      │                          → ExtendedPrismaClient
      ▼
 this.client: ExtendedPrismaClient
      │
      │ Read queries (findMany, findUnique, count, etc.)
      │   → routed to REPLICA_URL (by extension)
      │
      │ Write queries (create, update, delete, etc.)
      │   → routed to DATABASE_URL (primary)
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
  const mainAdapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const mainClient = new PrismaClient({ adapter: mainAdapter });

  const replicaAdapter = new PrismaPg({ connectionString: process.env.REPLICA_URL! });
  const replicaClient = new PrismaClient({ adapter: replicaAdapter });

  return mainClient.$extends(readReplicas({ replicas: [replicaClient] }));
}
```

**Note:** Both `DATABASE_URL` and `REPLICA_URL` are read directly from `process.env` (not via `ConfigService`). They must be set before the process starts.

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
| `findMany`, `findUnique`, `findFirst`, `count`, `aggregate`, `groupBy` | `REPLICA_URL` |
| `create`, `createMany`, `update`, `updateMany`, `upsert`, `delete`, `deleteMany` | `DATABASE_URL` (primary) |
| Transactions (`$transaction`) | `DATABASE_URL` (primary) |

If `REPLICA_URL` is the same as `DATABASE_URL`, all queries go to the single database (suitable for development).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for the **primary** (read/write) database |
| `REPLICA_URL` | Yes | PostgreSQL connection string for the **read replica**. Can equal `DATABASE_URL` in single-node setups. |

Both variables use the `@prisma/adapter-pg` PostgreSQL adapter. Connection string format:

```
postgresql://user:password@host:5432/database?schema=public
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
| `Credentials` | `prismaService.client.credentials` | `id`, `authId`, `passwordHash` |
| `RefreshToken` | `prismaService.client.refreshToken` | `id`, `token`, `authId`, `expiresAt` |
| `PasswordResetToken` | `prismaService.client.passwordResetToken` | `id`, `token`, `authId`, `expiresAt` |

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
