# Existing Patterns Reference

Quick-reference code patterns extracted from existing modules. Read the full files for complete context.

## Module Composition

### Authentication Module (`src/authentication/`)
Layers: `domain/` → `application/` → `infrastructure/` → `presentation/`
- Domain ports defined with `Symbol` tokens
- Infrastructure implements ports directly
- Single controller with versioned endpoints
- Events published from use cases via `EventBusPort`

### Identity Module (`src/identity/`)
Layers: `domain/` → `application/` → `infrastructure/` → `presentation/`
- Cross-module event consumption via `UserActivityHandler`
- Grouped use cases in subdirectories (`user/`, `user-activity/`, `user-profile/`)
- Multiple controllers (`UserController`, `UserProfileController`)

### Common Auth Module (`src/common/auth/`)
Layers: `domain/` → `application/` → `adapter/infrastructure/` → `adapter/presentation/`
- Uses `adapter/` prefix for infrastructure and presentation
- Full port coverage including cache, token validation, API key

### Common Event Manager (`src/common/event-manager/`)
Layers: `domain/` → `application/` → `adapter/infrastructure/` → `adapter/presentation/`
- `BaseEvent<T>` abstract class in domain
- `EventBusPort` interface in application ports
- `EventBusAdapter` implements port using `EventEmitter2`
- Event schemas registered in `application/schemas/`

## Key Imports

```typescript
// Event bus
import { EVENT_BUS_TOKEN, type EventBusPort } from 'src/common/event-manager/application/ports/event-bus.port';
import { BaseEvent } from 'src/common/event-manager';
import { EventMetadata } from 'src/common/event-manager';

// Common auth
import { AuthCtx, Role, AuthGuard, AuthContext, RolesGuard, RequireAnyRoles } from 'src/common/auth';

// Common presentation
import { CreatedResponse, OkResponse } from 'src/common';

// Common errors
import { GlobalErrorFilter, ErrorResponse, COMMON_PUBLIC_ERRORS } from 'src/common/errors';

// Prisma
import { PrismaService } from 'src/common/prisma/prisma.service';

// Config
import { AppConfigModule } from 'src/common/configuration/config.module';
```

## DI Wiring Pattern

```typescript
@Module({
  imports: [AppConfigModule],
  providers: [
    // Port → Adapter bindings
    { provide: ENTITY_REPOSITORY, useClass: PrismaEntityRepository },
    { provide: SERVICE_PORT, useClass: ConcreteServiceAdapter },
    // Use cases (auto-resolved)
    CreateEntityUseCase,
    GetEntityUseCase,
    // Event handlers
    EntityActivityHandler,
  ],
  controllers: [EntityController],
})
export class FeatureModule {}
```

## Error Pattern

```typescript
// domain/errors/{module}.error-codes.ts
export enum ModuleErrorCode {
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  ENTITY_ALREADY_EXISTS = 'ENTITY_ALREADY_EXISTS',
}

// domain/errors/{module}.errors.ts
export const MODULE_ERRORS: Record<ModuleErrorCode, AppError> = {
  [ModuleErrorCode.ENTITY_NOT_FOUND]: {
    code: ModuleErrorCode.ENTITY_NOT_FOUND,
    httpStatus: 404,
    message: 'Entity not found',
  },
};

// domain/errors/{module}.error-factory.ts
export class ModuleErrorFactory {
  static entityNotFound(): AppError {
    return MODULE_ERRORS[ModuleErrorCode.ENTITY_NOT_FOUND];
  }
}
```
