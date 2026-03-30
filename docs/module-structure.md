# Module Structure

This document defines the canonical folder structure for feature modules in this project. All modules follow hexagonal (ports & adapters), onion, and clean architecture principles.

## Canonical Structure

```
src/{module-name}/
├── {module-name}.module.ts
├── __fixtures__/                    # Test fixtures and factories
│   └── {module-name}.fixtures.ts
├── domain/
│   ├── entities/                    # Domain entities and value objects
│   │   ├── {entity}.entity.ts
│   │   └── {value-object}.value-object.ts
│   ├── events/                      # Domain events extending BaseEvent<T>
│   │   ├── index.ts
│   │   └── {entity}.events.ts
│   ├── errors/                      # Domain-specific errors and error factory
│   │   ├── index.ts
│   │   ├── {module}.error-codes.ts
│   │   ├── {module}.errors.ts
│   │   └── {module}.error-factory.ts
│   └── ports/                       # Repository interfaces and DI tokens
│       └── {entity}.repository.port.ts
├── application/
│   ├── use-cases/                   # Business logic orchestrators
│   │   ├── {action}.use-case.ts
│   │   └── {action}.use-case.spec.ts
│   ├── handlers/                    # Event handlers (@OnEvent subscribers)
│   │   └── {entity}-activity.handler.ts
│   └── dto/                         # Application-level data transfer objects
│       ├── {action}.input.ts
│       └── {entity}.output.ts
├── infrastructure/
│   ├── repositories/                # Prisma repository implementations
│   │   ├── {entity}.repository.ts
│   │   └── {entity}.repository.spec.ts
│   └── services/                    # External service adapters
│       ├── {service-name}.service.ts
│       └── {service-name}.service.spec.ts
└── presentation/
    ├── {module-name}.controller.ts
    ├── {module-name}.controller.spec.ts
    └── dto/                         # REST DTOs with Swagger decorators
        ├── {action}.input.dto.ts
        └── {entity}.output.dto.ts
```

## Layer Responsibilities

### Domain Layer (`domain/`)

Pure TypeScript with zero framework dependencies. Contains:

- **Entities**: Readonly interfaces or classes representing domain concepts
- **Value Objects**: Immutable types with self-validation
- **Events**: Domain event classes extending `BaseEvent<T>` from `src/common/event-manager`
- **Errors**: Module-specific error codes, error classes, and error factory
- **Ports**: Repository interfaces defining data access contracts with DI tokens (`Symbol`)

### Application Layer (`application/`)

Contains business logic orchestration. May depend on NestJS `@Injectable()` and domain layer.

- **Use Cases**: Single-purpose classes injecting ports, orchestrating business flows
- **Handlers**: Event subscribers using `@OnEvent()` decorator, delegating to use cases
- **DTOs**: Application-level input/output types used by use cases

### Infrastructure Layer (`infrastructure/`)

Implements ports using concrete technologies (Prisma, external APIs, etc.).

- **Repositories**: Prisma-based implementations of domain repository ports
- **Services**: External service adapters (e.g., password hashing, token issuers)

### Presentation Layer (`presentation/`)

HTTP-facing layer with NestJS controllers.

- **Controllers**: Versioned, decorated with Swagger, using guards and filters
- **DTOs**: REST-specific DTOs with `class-validator` decorators and `fromDomain`/`fromApplication` static methods

## Dependency Direction

```
presentation → application → domain ← infrastructure
```

- Domain layer has **zero** external dependencies
- Application layer depends on domain only (ports, entities, events)
- Infrastructure layer implements domain ports
- Presentation layer depends on application (use cases, DTOs)
- **No layer may import from a sibling layer** (infrastructure must not import from presentation and vice versa)

## Module Wiring

The module file (`{module-name}.module.ts`) binds ports to adapters using NestJS DI:

```typescript
@Module({
  providers: [
    { provide: ENTITY_REPOSITORY, useClass: EntityRepository },
    { provide: SERVICE_PORT, useClass: ServiceAdapter },
    SomeUseCase,
    AnotherUseCase,
  ],
  controllers: [ModuleController],
})
export class FeatureModule {}
```

## Cross-Module Communication

Modules communicate exclusively via the event bus:

- **Publishing**: Inject `EVENT_BUS_TOKEN` (type `EventBusPort`) in use cases
- **Subscribing**: Use `@OnEvent(EVENT_SCHEMA.eventName)` in handler classes
- **Never** import services, repositories, or use cases from another module directly

## Event Registration

Each module's events must be registered in `src/common/event-manager/application/schemas/`:

1. Create payload classes with `class-validator` decorators
2. Define `EventSchema<T>` objects with `eventName`, `version`, `module`, `description`
3. Export as a const object (e.g., `AuthenticationEventSchemas`)

## Reference Modules

- **Authentication** (`src/authentication/`): Full hexagonal structure with domain ports, infrastructure repositories, and presentation controller
- **Identity** (`src/identity/`): Event handler pattern with cross-module event consumption
- **Event Manager** (`src/common/event-manager/`): Canonical adapter pattern with `adapter/infrastructure/` and `adapter/presentation/`
- **Auth** (`src/common/auth/`): Canonical adapter pattern with full port/adapter separation
