# `src/common/event-manager` — Event Manager Module

> **Context document for AI-assisted code generation.**
> Covers purpose, architecture, event bus, event schemas, validation, decorators, and usage patterns.

---

## Table of Contents

1. [Purpose & Responsibilities](#purpose--responsibilities)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Files](#files)
5. [Built-in Event Schemas](#built-in-event-schemas)
6. [Complete Event Name Registry](#complete-event-name-registry)
7. [Usage Patterns](#usage-patterns)
8. [Public Barrel Exports](#public-barrel-exports)
9. [Test Coverage Map](#test-coverage-map)

---

## Purpose & Responsibilities

`src/common/event-manager` provides the **internal in-process event bus** for decoupled communication between application modules. Modules must not call each other directly; they communicate by publishing and subscribing to domain events via this module.

Responsibilities:
- Provide `EventBusAdapter` (backed by `@nestjs/event-emitter`) for publishing domain events.
- Validate event payloads against their schema definitions using `class-validator` before publishing.
- Maintain a central `EventRegistryService` that registers and looks up all event schemas at startup.
- Define all cross-module event payload classes and `EventSchema` descriptors.
- Expose `@InjectEventBus()` and `@ValidateEvent()` decorators for convenient DI and handler-level validation.

---

## Architecture Overview

The module follows **Hexagonal / Onion / Clean Architecture** with the same layer structure as `src/common/auth`:

```
domain/           Pure TypeScript — no framework, no external libs
    └── errors/   EventValidationError, EventFieldError
    └── events/   BaseEvent<T>, EventSchema<T>, EventBusMessage<T>, EventMetadata

application/      Ports (interfaces + DI tokens), application-layer utilities and data contracts
    ├── ports/    EventBusPort interface + EVENT_BUS_TOKEN
    │             EventValidatorPort interface + EVENT_VALIDATOR_TOKEN
    │             EventRegistryPort interface + EVENT_REGISTRY_TOKEN
    ├── utils/    validateEventPayload() — shared validation utility (class-validator)
    └── schemas/  Payload DTOs with class-validator decorators; EventSchema descriptors

adapter/          Framework-specific and infrastructure implementations
    ├── infrastructure/  EventBusAdapter, EventValidator, EventRegistryService
    └── presentation/    @InjectEventBus(), @ValidateEvent() decorators
```

Dependency direction (inner layers never import outer layers):

```
presentation  ──►  application  ──►  domain
infrastructure ──►  application  ──►  domain
```

Both `adapter/infrastructure/EventValidator` and `adapter/presentation/ValidateEvent` delegate payload validation to the application-layer utility `validateEventPayload()`. Neither adapter layer imports from the other.

### Publish / Subscribe flow

```
Publishing side                         Subscribing side
─────────────                           ────────────────
Feature Service                         Feature Handler (@Injectable)
  │                                         │
  │ @InjectEventBus()                       │ @OnEvent('authentication.user.registered')
  ▼                                         ▼
EventBusPort                            handleUserRegistered(message: EventBusMessage<T>)
  │
  │ publish(new UserRegisteredEvent(payload))
  ▼
EventBusAdapter (provides EventBusPort)
  │ 1. eventValidator.validate(schema, payload) → EventValidator → class-validator
  │ 2. eventEmitter.emitAsync()   → @nestjs/event-emitter (EventEmitter2)
  │                                    │
  │                                    └──> all @OnEvent('authentication.user.registered') handlers
  └─ on EventValidationError: log + rethrow
```

`EventManagerModule` is `@Global()` — available application-wide without explicit importing.


---

## Folder Structure

```
src/common/event-manager/
├── event-manager.module.ts
├── index.ts
├── domain/
│   ├── errors/
│   │   └── event.errors.ts                 EventValidationError, EventFieldError
│   └── events/
│       ├── base.event.ts                   BaseEvent<T> abstract class
│       └── event.interface.ts              EventMetadata, EventSchema<T>, EventBusMessage<T>
├── application/
│   ├── ports/
│   │   ├── event-bus.port.ts              EventBusPort interface + EventBusPort token
│   │   ├── event-validator.port.ts        EventValidatorPort interface + EVENT_VALIDATOR_TOKEN
│   │   └── event-registry.port.ts         EventRegistryPort interface + EVENT_REGISTRY_TOKEN
│   ├── utils/
│   │   └── validate-event-payload.ts      validateEventPayload<T>() standalone utility
│   └── schemas/
│       ├── index.ts                        Re-exports all schemas
│       ├── authentication.events.ts        AuthenticationEventSchemas
│       ├── identity.events.ts              IdentityEventSchemas
│       └── invitation.events.ts            InvitationEventSchemas
└── adapter/
    ├── infrastructure/
    │   ├── event-validator.ts             EventValidator (@Injectable, implements EventValidatorPort)
    │   ├── event-bus.adapter.ts           EventBusAdapter (@Injectable, implements EventBusPort)
    │   └── event-registry.service.ts      EventRegistryService (@Injectable, implements EventRegistryPort, OnModuleInit)
    └── presentation/
        └── decorators/
            ├── inject-event-bus.decorator.ts   @InjectEventBus()
            └── validate-event.decorator.ts     @ValidateEvent()
```

---

## Files

### `event-manager.module.ts`

`@Global()` module. Configures `EventEmitter2` with wildcard support and dot delimiter.

```typescript
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,      // Enables 'module.*' wildcard subscriptions
      delimiter: '.',      // Event name segments separated by '.'
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    { provide: EVENT_REGISTRY_TOKEN, useClass: EventRegistryService },
    { provide: EVENT_VALIDATOR_TOKEN, useClass: EventValidator },
    { provide: EVENT_BUS_TOKEN, useClass: EventBusAdapter },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventManagerModule {}
```

**Exported token:** `EVENT_BUS_TOKEN` (`Symbol('EventBusPort')`) → `EventBusAdapter`. Access via `@InjectEventBus()`.

`EVENT_REGISTRY_TOKEN` and `EVENT_VALIDATOR_TOKEN` are internal — not exported from the module.


---

### `application/ports/event-bus.port.ts`

Single source of truth for the event bus port — DI token and interface:

```typescript
export const EVENT_BUS_TOKEN = Symbol('EventBusPort');

export interface EventBusPort {
  publish<T extends object>(event: BaseEvent<T>): Promise<void>;
}
```

---

### `application/ports/event-validator.port.ts`

Port for the validation contract — DI token and interface:

```typescript
export const EVENT_VALIDATOR_TOKEN = Symbol('EventValidatorPort');

export interface EventValidatorPort {
  validate<T extends object>(schema: EventSchema<T>, payload: T): Promise<void>;
}
```

`EventBusAdapter` injects `EventValidatorPort` via `@Inject(EVENT_VALIDATOR_TOKEN)` rather than the concrete `EventValidator` class, keeping the infrastructure adapters decoupled.

---

### `application/ports/event-registry.port.ts`

Port for the event schema registry — DI token and interface:

```typescript
export const EVENT_REGISTRY_TOKEN = Symbol('EventRegistryPort');

export interface EventRegistryPort {
  registerEventType<T extends object>(schema: EventSchema<T>): void;
  getEventSchema<T extends object>(eventName: string): EventSchema<T> | undefined;
  hasEventType(eventName: string): boolean;
  getAllEventTypes(): EventSchema<object>[];
  getEventTypesByModule(module: string): EventSchema<object>[];
}
```

`EventRegistryService` implements this interface. The token is provided in `EventManagerModule` but not exported — the registry is an internal startup concern.

---

### `application/utils/validate-event-payload.ts`

Standalone async utility that runs `class-validator` checks on an event payload and returns a fully-transformed class instance:

```typescript
export async function validateEventPayload<T extends object>(
  schema: EventSchema<T>,
  payload: T,
): Promise<T>
// Returns a class instance created via plainToInstance + validated against class-validator decorators.
// Throws EventValidationError with populated EventFieldError[] when validation fails.
```

**Validation process:**
1. Extracts the payload class constructor from `schema.schema.constructor`.
2. `plainToInstance(PayloadClass, payload)` — transforms the plain object to a typed class instance.
3. `validate(instance)` — runs all `class-validator` decorators.
4. If `errors.length > 0` → maps to `EventFieldError[]` and throws `EventValidationError`.
5. Returns the transformed instance on success.

Both `EventValidator` (infrastructure) and `@ValidateEvent()` (presentation) delegate to this utility, keeping cross-layer logic in the application layer without either adapter importing from the other.

---

### `domain/errors/event.errors.ts`

#### `EventFieldError`

A framework-free error detail type owned by the domain:

```typescript
interface EventFieldError {
  readonly field: string;      // Property name that failed validation
  readonly messages: string[]; // Human-readable constraint failure messages
}
```

#### `EventValidationError`

```typescript
class EventValidationError extends Error {
  readonly name = 'EventValidationError';
  readonly validationErrors: EventFieldError[];

  getValidationMessages(): string[]
  // Returns flat array of all messages from all field errors
}
```

> **Note:** The domain error type does not import `class-validator`. The application-layer utility `validateEventPayload()` and the infrastructure adapter `EventRegistryService` are responsible for mapping `class-validator`'s `ValidationError[]` into `EventFieldError[]` before constructing the error.

Thrown by:
- `validateEventPayload()` when event payload fails class-validator constraints.
- `EventBusAdapter.publish()` when validation fails.
- `@ValidateEvent()` decorator when handler receives an invalid payload.
- `EventRegistryService.registerEventType()` when schema structure is invalid or duplicate.

---

### `domain/events/event.interface.ts`

#### `EventMetadata`

```typescript
interface EventMetadata {
  correlationId?: string;           // For tracing event chains
  metadata?: Record<string, unknown>; // Arbitrary context (e.g. requestId, userId)
  timestamp: number;                // Unix ms when event was created
  version: string;                  // Schema semver (e.g. '1.0.0')
}
```

#### `EventSchema<T>`

Describes a named, versioned event type:

```typescript
interface EventSchema<T = unknown> {
  readonly eventName: string;   // 'module.entity.action' (e.g. 'authentication.user.registered')
  readonly schema: T;           // An instance of the payload class (for class-validator reflection)
  readonly version: string;     // Semver string (e.g. '1.0.0')
  readonly module: string;      // Module name (e.g. 'authentication')
  readonly description: string; // Human-readable description
}
```

#### `EventBusMessage<T>`

The structure passed to `@OnEvent` handlers:

```typescript
interface EventBusMessage<T = unknown> {
  readonly eventId: string;       // UUIDv7 unique per event instance
  readonly eventName: string;     // Same as EventSchema.eventName
  readonly payload: T;            // Typed event data
  readonly metadata: EventMetadata;
}
```

---

### `domain/events/base.event.ts`

#### `BaseEvent<T>`

All domain event classes must extend `BaseEvent<T>`:

```typescript
abstract class BaseEvent<T extends object = object> implements EventBusMessage<T> {
  readonly eventId: string;         // Auto-generated UUIDv7
  readonly eventName: string;       // From schema.eventName
  readonly metadata: EventMetadata; // Auto-populated with timestamp + version

  protected readonly schema: EventSchema<T>;

  constructor(
    schema: EventSchema<T>,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
    // ^ pass correlationId or extra metadata here
  )

  abstract toJSON(): T             // Must return the typed payload object

  get payload(): T                 // Calls toJSON()
  getSchema(): EventSchema<T>
  getPartitionKey(): string        // Default: eventId (override for Kafka partitioning)
}
```

**Creating a concrete event class:**

```typescript
import { BaseEvent, AuthenticationEventSchemas, UserRegisteredPayload } from 'src/common/event-manager';

export class UserRegisteredEvent extends BaseEvent<UserRegisteredPayload> {
  constructor(
    private readonly data: UserRegisteredPayload,
    correlationId?: string,
  ) {
    super(AuthenticationEventSchemas.USER_REGISTERED, { correlationId });
  }

  toJSON(): UserRegisteredPayload {
    return this.data;
  }
}
```

---

### `adapter/infrastructure/event-validator.ts`

#### `EventValidator`

Thin injectable adapter that implements `EventValidatorPort`. Delegates all validation logic to the application-layer utility:

```typescript
@Injectable()
class EventValidator implements EventValidatorPort {
  async validate<T extends object>(schema: EventSchema<T>, payload: T): Promise<void>
  // Delegates to validateEventPayload() from application/utils
  // Used by EventBusAdapter via DI (EVENT_VALIDATOR_TOKEN)
}
```

The concrete implementation contains no validation logic itself — it acts as a DI bridge between the NestJS container and the framework-agnostic `validateEventPayload()` utility.

---

### `adapter/infrastructure/event-bus.adapter.ts`

#### `EventBusAdapter`

The concrete implementation of `EventBusPort`:

```typescript
@Injectable()
class EventBusAdapter implements EventBusPort {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(EVENT_VALIDATOR_TOKEN) private readonly eventValidator: EventValidatorPort,
  ) {}

  async publish<T extends object>(event: BaseEvent<T>): Promise<void>
}
```

**`publish()` flow:**
1. Calls `eventValidator.validate(event.getSchema(), event.payload)`.
2. On `EventValidationError` → logs `getValidationMessages()` + rethrows.
3. Constructs `EventBusMessage<T>` from the event.
4. `eventEmitter.emitAsync(event.eventName, message)` — publishes to all subscribers.
5. On other errors → logs and rethrows.

---

### `adapter/infrastructure/event-registry.service.ts`

#### `EventRegistryService`

Concrete implementation of `EventRegistryPort`. Maintains a `Map<string, EventSchema>` of all registered event types. Runs on `OnModuleInit`:

```typescript
@Injectable()
class EventRegistryService implements OnModuleInit, EventRegistryPort {
  onModuleInit(): void
  // Registers AuthenticationEventSchemas, IdentityEventSchemas, InvitationEventSchemas
  // Logs total count on success

  registerEventType<T extends object>(schema: EventSchema<T>): void
  // Throws if: missing required fields, class-validator errors, duplicate eventName

  getEventSchema<T extends object>(eventName: string): EventSchema<T> | undefined
  hasEventType(eventName: string): boolean
  getAllEventTypes(): EventSchema<object>[]
  getEventTypesByModule(module: string): EventSchema<object>[]
}
```

Provided via `EVENT_REGISTRY_TOKEN` in `EventManagerModule` — not exported to consumers.

---

### `adapter/presentation/decorators/inject-event-bus.decorator.ts`

#### `@InjectEventBus()`

Sugar for `@Inject(EVENT_BUS_TOKEN)`:

```typescript
export const InjectEventBus = () => Inject(EVENT_BUS_TOKEN);
```

Use in constructor injection:

```typescript
constructor(@InjectEventBus() private readonly eventBus: EventBusPort) {}
```

---

### `adapter/presentation/decorators/validate-event.decorator.ts`

#### `@ValidateEvent()`

Method decorator for event handler methods. Delegates payload validation and transformation to the application-layer `validateEventPayload()` utility before calling the original handler:

```typescript
export function ValidateEvent(): MethodDecorator
```

**Flow:**
1. Checks `event.eventName` and `event.payload` exist.
2. Gets `event.getSchema()`.
3. `await validateEventPayload(schema, event.payload)` — validates and returns a transformed class instance; throws `EventValidationError` if invalid.
4. Calls original handler with `{ ...event, payload: payloadInstance }`.
5. On any failure → logs and rethrows `EventValidationError` (wrapping non-validation errors).

Use on `@OnEvent` handler methods when you want validation before processing:

```typescript
@OnEvent('authentication.user.registered')
@ValidateEvent()
async handleUserRegistered(event: EventBusMessage<UserRegisteredPayload>): Promise<void> {
  // payload is already validated and transformed to class instance
}
```

---

## Built-in Event Schemas

### Authentication Events (`AuthenticationEventSchemas`)

Module: `authentication` | Delimiter format: `authentication.user.{action}`

| Schema key | `eventName` | Payload class | Description |
|---|---|---|---|
| `USER_REGISTERED` | `authentication.user.registered` | `UserRegisteredPayload` | New user registered |
| `USER_LOGGED_IN` | `authentication.user.logged.in` | `UserLoggedInPayload` | User authenticated |
| `USER_LOGGED_OUT` | `authentication.user.logged.out` | `UserLoggedOutPayload` | User session ended |
| `USER_PASSWORD_CHANGED` | `authentication.user.password.changed` | `UserPasswordChangedPayload` | Password changed by logged-in user |
| `USER_PASSWORD_RESET_REQUESTED` | `authentication.user.password.reset.requested` | `UserPasswordResetRequestedPayload` | Password reset initiated |
| `USER_PASSWORD_RESET_COMPLETED` | `authentication.user.password.reset.completed` | `UserPasswordResetCompletedPayload` | Password reset confirmed |

**Base payload for all authentication events:**

```typescript
class BaseAuthenticationPayload {
  @IsUUID() userId: string;
}
```

`UserRegisteredPayload` and `UserPasswordResetRequestedPayload` additionally require `@IsEmail() email: string`.

---

### Identity Events (`IdentityEventSchemas`)

Module: `identity` | Format: `identity.user.{action}`

| Schema key | `eventName` | Payload class | Key fields |
|---|---|---|---|
| `USER_CREATED` | `identity.user.created` | `UserCreatedPayload` | `userId`, `authId`, `firstName`, `roles`, `isActive`, optional `email`, `phone`, `lastName`, `avatar` |
| `USER_UPDATED` | `identity.user.updated` | `UserUpdatedPayload` | Same as `UserCreatedPayload` |
| `USER_ROLE_CHANGED` | `identity.user.role.changed` | `UserRoleChangedPayload` | `userId`, `roles`, `operatorId` |
| `USER_DEACTIVATED` | `identity.user.deactivated` | `UserDeactivatedPayload` | `userId`, `operatorId` |
| `USER_ACTIVATED` | `identity.user.activated` | `UserActivatedPayload` | `userId`, `operatorId` |
| `USER_DELETED` | `identity.user.deleted` | `UserDeletedPayload` | `userId`, `operatorId` |

> `roles` fields use `Role` imported from `src/common/auth` (the public barrel, not an internal path).

---

### Invitation Events (`InvitationEventSchemas`)

Module: `invitation`

| Schema key | `eventName` | Payload class | Key fields |
|---|---|---|---|
| `INVITATION_ACCEPTED` | `invitation.accepted` | `InvitationAcceptedPayload` | `invitationId`, `inviterId`, `acceptedBy` (all UUID), `code` (string) |

---

## Complete Event Name Registry

| `eventName` | Module | Version |
|---|---|---|
| `authentication.user.registered` | authentication | 1.0.0 |
| `authentication.user.logged.in` | authentication | 1.0.0 |
| `authentication.user.logged.out` | authentication | 1.0.0 |
| `authentication.user.password.changed` | authentication | 1.0.0 |
| `authentication.user.password.reset.requested` | authentication | 1.0.0 |
| `authentication.user.password.reset.completed` | authentication | 1.0.0 |
| `identity.user.created` | identity | 1.0.0 |
| `identity.user.updated` | identity | 1.0.0 |
| `identity.user.role.changed` | identity | 1.0.0 |
| `identity.user.deactivated` | identity | 1.0.0 |
| `identity.user.activated` | identity | 1.0.0 |
| `identity.user.deleted` | identity | 1.0.0 |
| `invitation.accepted` | invitation | 1.0.0 |

---

## Usage Patterns

### Publishing an event from a service

```typescript
import { Injectable } from '@nestjs/common';
import {
  EventBusPort,
  InjectEventBus,
  BaseEvent,
  AuthenticationEventSchemas,
  UserRegisteredPayload,
} from 'src/common/event-manager';

class UserRegisteredEvent extends BaseEvent<UserRegisteredPayload> {
  constructor(private readonly data: UserRegisteredPayload) {
    super(AuthenticationEventSchemas.USER_REGISTERED);
  }
  toJSON(): UserRegisteredPayload {
    return this.data;
  }
}

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectEventBus() private readonly eventBus: EventBusPort,
  ) {}

  async register(userId: string, email: string): Promise<void> {
    // ... business logic ...
    await this.eventBus.publish(new UserRegisteredEvent({ userId, email }));
  }
}
```

---

### Subscribing to events

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBusMessage, UserRegisteredPayload } from 'src/common/event-manager';

@Injectable()
export class IdentityEventHandler {

  @OnEvent('authentication.user.registered')
  async handleUserRegistered(
    message: EventBusMessage<UserRegisteredPayload>,
  ): Promise<void> {
    const { payload, metadata } = message;
    // Create user profile from payload.userId, payload.email
  }
}
```

---

### Using wildcard subscriptions

```typescript
@OnEvent('authentication.*')
async handleAnyAuthEvent(message: EventBusMessage): Promise<void> {
  // Receives all events matching 'authentication.*'
}

@OnEvent('identity.user.*')
async handleAnyUserEvent(message: EventBusMessage): Promise<void> {
  // Receives identity.user.created, identity.user.updated, etc.
}
```

---

### Registering a new event schema

1. Create payload class with `class-validator` decorators in the relevant schema file under `application/schemas/`.
2. Add `EventSchema<PayloadClass>` entry to the schema collection object.
3. Register the schema group in `EventRegistryService.onModuleInit()`.

```typescript
// 1. Payload class (application/schemas/order.events.ts)
export class OrderCreatedPayload {
  @IsUUID() orderId: string;
  @IsUUID() userId: string;
}

// 2. Schema entry
export const OrderEventSchemas = {
  ORDER_CREATED: {
    eventName: 'order.created',
    schema: new OrderCreatedPayload(),
    version: '1.0.0',
    module: 'order',
    description: 'Emitted when an order is placed',
  } as EventSchema<OrderCreatedPayload>,
} as const;

// 3. Register in EventRegistryService.onModuleInit()
this.registerEventSchemas(OrderEventSchemas as Record<string, EventSchema<object>>);
```

---

### Passing correlation ID for tracing

```typescript
await this.eventBus.publish(
  new UserRegisteredEvent(
    { userId, email },
    { correlationId: requestId },
  ),
);
```

---

## Public Barrel Exports

From `src/common/event-manager/index.ts`:

```typescript
export { InjectEventBus }
export { EVENT_BUS_TOKEN, type EventBusPort }
export { BaseEvent }
export * from './application/schemas'       // All payload classes + EventSchema objects
export * from './domain/events/event.interface' // EventMetadata, EventSchema<T>, EventBusMessage<T>
```

Import path:

```typescript
import {
  InjectEventBus,
  EVENT_BUS_TOKEN,
  EventBusPort,
  BaseEvent,
  AuthenticationEventSchemas,
  IdentityEventSchemas,
  InvitationEventSchemas,
  type EventBusMessage,
  type EventSchema,
} from 'src/common/event-manager';
```

> **Note:** `EventBusAdapter` is not exported. Consumers depend only on the `EventBusPort` abstraction injected via `@InjectEventBus()` or `@Inject(EVENT_BUS_TOKEN)`.

---

## Test Coverage Map

| Spec file | Source file | What is tested |
|---|---|---|
| `domain/errors/event.errors.spec.ts` | `domain/errors/event.errors.ts` | `instanceof Error`; `name = 'EventValidationError'`; message stored; `EventFieldError[]` array stored; `getValidationMessages()` returns flat array of all messages; empty errors → empty array; errors with no messages → empty array |
| `domain/events/base.event.spec.ts` | `domain/events/base.event.ts` | `eventId` non-empty UUID; `eventName` from schema; `metadata.version` and `metadata.timestamp`; optional `correlationId`; `payload` delegates to `toJSON()`; `getSchema()` returns schema; `getPartitionKey()` returns `eventId`; unique `eventId` per instance |
| `application/utils/validate-event-payload.spec.ts` | `application/utils/validate-event-payload.ts` | Valid payload → resolves with transformed class instance; invalid email → `EventValidationError`; empty required field → `EventValidationError`; error message contains `eventName`; `validationErrors` populated with `EventFieldError` shape; multiple invalid fields → multiple errors |
| `adapter/infrastructure/event-validator.spec.ts` | `adapter/infrastructure/event-validator.ts` | Instance `validate()` — valid payload resolves; invalid email throws; missing required field throws; error message contains `eventName`; `validationErrors` populated with `EventFieldError` shape |
| `adapter/infrastructure/event-bus.adapter.spec.ts` | `adapter/infrastructure/event-bus.adapter.ts` | Valid event → `emitAsync` called with correct `EventBusMessage` (eventId, eventName, payload, metadata); validation failure → `EventValidationError` thrown, `emitAsync` not called; `emitAsync` throws → error rethrown |
| `adapter/infrastructure/event-registry.service.spec.ts` | `adapter/infrastructure/event-registry.service.ts` | `onModuleInit` registers all built-in schemas; `registerEventType` — valid schema, missing `eventName`/`schema`/`version` throw `EventValidationError`, `validateSync` errors throw, duplicate name throws; `getEventSchema` — found/not found; `hasEventType` — true/false; `getAllEventTypes`; `getEventTypesByModule` |
| `adapter/presentation/decorators/validate-event.decorator.spec.ts` | `adapter/presentation/decorators/validate-event.decorator.ts` | Valid event → original method called; missing `eventName` → `EventValidationError`; missing `payload` → `EventValidationError`; invalid payload → `EventValidationError`; null schema → `EventValidationError`; non-`EventValidationError` thrown inside → wrapped in `EventValidationError` |
| `adapter/presentation/decorators/inject-event-bus.decorator.spec.ts` | `adapter/presentation/decorators/inject-event-bus.decorator.ts` | Returns a parameter decorator function; can be applied to constructor parameter |
