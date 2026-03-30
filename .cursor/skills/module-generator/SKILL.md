---
name: module-generator
description: >-
  Scaffold and implement a new NestJS module following hexagonal, onion, and clean architecture
  with event-driven patterns. Creates folder structure, domain entities, ports, adapters, use cases,
  controllers, and module wiring. Use when creating a new module, implementing a feature from a
  design document, or scaffolding module structure.
---

# Module Generator

## Role

You are the **Developer / Technical Leader**. Scaffold and implement modules following the project's architecture patterns.

## Workflow

### Step 1: Read Context

1. Read the architecture design from `tasks/designs/` (if available)
2. Read the task specification from `tasks/work/` (if available)
3. Read `docs/module-structure.md` for canonical folder structure
4. Read existing module for consistency:
   - `src/authentication/` — full hexagonal reference
   - `src/identity/` — event handler pattern reference
5. Read `prisma/schema.prisma` for current data model
6. Read `src/common/event-manager/application/schemas/index.ts` for existing event schemas
7. See [existing-patterns reference](reference/existing-patterns.md) for code snippets

### Step 2: Scaffold Structure

Create the complete folder structure per `docs/module-structure.md`:

```
src/{module-name}/
├── {module-name}.module.ts
├── __fixtures__/
│   └── {module-name}.fixtures.ts
├── domain/
│   ├── entities/
│   ├── events/
│   │   └── index.ts
│   ├── errors/
│   │   └── index.ts
│   └── ports/
├── application/
│   ├── use-cases/
│   ├── handlers/
│   └── dto/
├── infrastructure/
│   ├── repositories/
│   └── services/
└── presentation/
    └── dto/
```

### Step 3: Implement Inside-Out (Onion Order)

Implement layers from innermost to outermost. Each layer must compile before moving to the next.

**3a. Domain Entities** (`domain/entities/`)
- Define readonly interfaces for each entity
- Define value objects with self-validation if needed
- Zero framework imports

**3b. Domain Events** (`domain/events/`)
- Create event classes extending `BaseEvent<T>` from `src/common/event-manager`
- Each event has a `toJSON()` method returning the payload
- Re-export schemas as `MODULE_EVENTS` from the index

**3c. Domain Errors** (`domain/errors/`)
- Define error codes as string enum
- Define error map with HTTP status and messages
- Create error factory with static methods

**3d. Domain Ports** (`domain/ports/`)
- Define repository interfaces with `Symbol` DI tokens
- Define input types for repository methods
- Keep interfaces minimal — only methods the use cases actually need

**3e. Application DTOs** (`application/dto/`)
- Input DTOs for use cases (not the same as REST DTOs)
- Output DTOs if transformation is needed

**3f. Application Use Cases** (`application/use-cases/`)
- One class per user action, decorated with `@Injectable()`
- Inject ports via `@Inject(TOKEN)` — never concrete classes
- Inject `EventBusPort` via `@Inject(EVENT_BUS_TOKEN)` if events are published
- Single `execute()` method with typed input and output
- Throw domain errors for business rule violations

**3g. Application Event Handlers** (`application/handlers/`)
- `@Injectable()` class with `@OnEvent()` decorated methods
- Delegate to use cases — no business logic in handlers
- Import event names from domain events or other module schemas

**3h. Infrastructure Repositories** (`infrastructure/repositories/`)
- Implement domain port interfaces
- Inject `PrismaService` for database operations
- Decorated with `@Injectable()`

**3i. Infrastructure Services** (`infrastructure/services/`)
- Implement service port interfaces for external integrations
- e.g., hashing, token issuance, email sending

**3j. Presentation Controllers** (`presentation/`)
- Versioned controllers: `@Controller({ path: '{module}', version: '1' })`
- Swagger decorators: `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`
- Guard decorators: `@UseGuards(AuthGuard, RolesGuard)`, `@RequireAnyRoles(...)`
- Error response decorators: `@ErrorResponse`, `@UseFilters(GlobalErrorFilter)`
- Response decorators: `@CreatedResponse`, `@OkResponse`

**3k. Presentation DTOs** (`presentation/dto/`)
- Input DTOs with `class-validator` decorators and Swagger decorators
- Output DTOs with `fromDomain()` or `fromApplication()` static methods

### Step 4: Event Schema Registration

1. Create payload classes in `src/common/event-manager/application/schemas/{module}.events.ts`
2. Define `EventSchema<T>` objects with all required fields
3. Export from `src/common/event-manager/application/schemas/index.ts`

### Step 5: Module Wiring

1. Create `{module-name}.module.ts`:
   - Bind all ports to adapters: `{ provide: TOKEN, useClass: Adapter }`
   - Register all use cases as providers
   - Register event handler as provider
   - Register controllers
2. Add module to `src/app.module.ts` imports

### Step 6: Database Migration (if needed)

1. Update `prisma/schema.prisma` with new models
2. Run `pnpx prisma migrate dev --name {migration-name}`
3. Run `pnpx prisma generate`

### Step 7: Validate

1. Run `pnpm lint` — fix any issues
2. Run `pnpm build` — verify compilation
3. Verify no circular dependencies between modules
