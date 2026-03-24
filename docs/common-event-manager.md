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

```
Publishing side                         Subscribing side
─────────────                           ────────────────
Feature Service                         Feature Handler (@Injectable)
  │                                         │
  │ @InjectEventBus()                       │ @OnEvent('authentication.user.registered')
  ▼                                         ▼
IEventBus (EVENT_BUS_TOKEN)             handleUserRegistered(message: EventBusMessage<T>)
  │
  │ publish(new UserRegisteredEvent(payload))
  ▼
EventBusAdapter
  │ 1. event.validate()           → EventValidator → class-validator
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
├── entities/
│   ├── tokens.ts                            DI token: EVENT_BUS_TOKEN
│   ├── errors/
│   │   └── event.errors.ts                 EventValidationError
│   ├── events/
│   │   ├── base.event.ts                   BaseEvent<T> abstract class
│   │   ├── event.interface.ts              EventMetadata, EventSchema<T>, EventBusMessage<T>, EventBus
│   │   └── schemas/
│   │       ├── index.ts                    Re-exports all schemas
│   │       ├── authentication.events.ts    AuthenticationEventSchemas
│   │       ├── identity.events.ts          IdentityEventSchemas
│   │       └── invitation.events.ts        InvitationEventSchemas
│   └── validation/
│       └── event.validator.ts              EventValidator (static class)
├── services/
│   ├── event-bus.adapter.ts                EventBusAdapter (@Injectable)
│   ├── event-registry.service.ts           EventRegistryService (@Injectable, OnModuleInit)
│   └── interfaces/
│       └── event-bus.interface.ts          EventBus interface
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
    EventValidator,
    { provide: EVENT_BUS_TOKEN, useClass: EventBusAdapter },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventManagerModule {}
```

**Exported token:** `EVENT_BUS_TOKEN` → `EventBusAdapter`. Access via `@InjectEventBus()`.

> **Note:** `EventRegistryService` is defined and instantiated but not currently listed as a provider in the module declaration. It is used internally by `EventBusAdapter` during schema registration at startup.

---

### `entities/tokens.ts`

```typescript
export const EVENT_BUS_TOKEN = 'IEventBus';
```

String token for DI. Use `@InjectEventBus()` instead of `@Inject(EVENT_BUS_TOKEN)` directly.

---

### `entities/errors/event.errors.ts`

#### `EventValidationError`

```typescript
class EventValidationError extends Error {
  readonly name = 'EventValidationError';
  readonly validationErrors: ValidationError[];  // from class-validator

  getValidationMessages(): string[]
  // Returns human-readable constraint failure messages
}
```

Thrown by:
- `EventValidator.validate()` when payload fails `class-validator` constraints.
- `EventBusAdapter.publish()` when `event.validate()` fails.
- `@ValidateEvent()` decorator when handler receives an invalid payload.
- `EventRegistryService.registerEventType()` when schema structure is invalid or duplicate.

---

### `entities/events/event.interface.ts`

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

#### `EventBus`

```typescript
interface EventBus {
  publish<T extends object>(event: BaseEvent<T>): Promise<void>;
}
```

---

### `entities/events/base.event.ts`

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
  async validate(): Promise<void>  // Validates payload via EventValidator
}
```

**Creating a concrete event class:**

```typescript
import { BaseEvent } from 'src/common/event-manager';
import { AuthenticationEventSchemas, UserRegisteredPayload } from 'src/common/event-manager';

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

### `entities/validation/event.validator.ts`

#### `EventValidator`

A static utility class (not injectable — used internally by `BaseEvent`):

```typescript
class EventValidator {
  static async validate<T extends object>(
    schema: EventSchema<T>,
    payload: T,
  ): Promise<void>
  // Uses plainToInstance + validate from class-validator
  // Throws EventValidationError if any constraint fails
}
```

Validation process:
1. Extracts the payload class constructor from `schema.schema.constructor`.
2. `plainToInstance(PayloadClass, payload)` — transforms the plain object to a class instance.
3. `validate(instance)` — runs all `class-validator` decorators.
4. If `errors.length > 0` → throws `EventValidationError`.

---

### `services/event-bus.adapter.ts`

#### `EventBusAdapter`

The concrete implementation of `IEventBus`:

```typescript
@Injectable()
class EventBusAdapter {
  async publish<T extends object>(event: BaseEvent<T>): Promise<void>
}
```

**`publish()` flow:**
1. Calls `event.validate()` → `EventValidator.validate(schema, payload)`.
2. On `EventValidationError` → logs error messages + rethrows.
3. Constructs `EventBusMessage<T>` from the event.
4. `eventEmitter.emitAsync(event.eventName, message)` — publishes to all subscribers.
5. On other errors → logs and rethrows.

---

### `services/event-registry.service.ts`

#### `EventRegistryService`

Maintains a `Map<string, EventSchema>` of all registered event types. Runs on `OnModuleInit`:

```typescript
@Injectable()
class EventRegistryService implements OnModuleInit {
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

---

### `presentation/decorators/inject-event-bus.decorator.ts`

#### `@InjectEventBus()`

Sugar for `@Inject(EVENT_BUS_TOKEN)`:

```typescript
export const InjectEventBus = () => Inject(EVENT_BUS_TOKEN);
```

Use in constructor injection:

```typescript
constructor(@InjectEventBus() private readonly eventBus: IEventBus) {}
```

---

### `presentation/decorators/validate-event.decorator.ts`

#### `@ValidateEvent()`

Method decorator for event handler methods. Validates the first argument (a `BaseEvent`) before the handler runs:

```typescript
export function ValidateEvent(): MethodDecorator
```

**Flow:**
1. Checks `event.eventName` and `event.payload` exist.
2. Gets `event.getSchema()`.
3. `plainToInstance(PayloadClass, event.payload)` + `validateSync(instance)`.
4. On success → calls original handler with the class instance as first arg.
5. On any failure → throws `EventValidationError`.

Use on `@OnEvent` handler methods when you want synchronous validation before processing:

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
  @IsUUID() authId: string;
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

> `UserCreatedPayload` and `UserUpdatedPayload` import `Role` from `src/identity/domain/entities/role.enum` (not from `src/common/auth`).

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
  IEventBus,
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
    @InjectEventBus() private readonly eventBus: IEventBus,
  ) {}

  async register(authId: string, email: string): Promise<void> {
    // ... business logic ...
    await this.eventBus.publish(new UserRegisteredEvent({ authId, email }));
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
    // Create user profile from payload.authId, payload.email
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

1. Create payload class with `class-validator` decorators in the relevant schema file.
2. Add `EventSchema<PayloadClass>` entry to the schema collection object.
3. Register the schema group in `EventRegistryService.onModuleInit()`.

```typescript
// 1. Payload class
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
    { authId, email },
    { correlationId: requestId },
  ),
);
```

---

## Public Barrel Exports

From `src/common/event-manager/index.ts`:

```typescript
export { InjectEventBus }
export { type EventBus as IEventBus }
export { EventBusAdapter }
export { BaseEvent }
export * from './entities/events/schemas'    // All payload classes + EventSchema objects
export * from './entities/events/event.interface'  // EventMetadata, EventSchema<T>,
                                                    // EventBusMessage<T>, EventBus
```

Import path:

```typescript
import {
  InjectEventBus,
  IEventBus,
  BaseEvent,
  AuthenticationEventSchemas,
  IdentityEventSchemas,
  InvitationEventSchemas,
  type EventBusMessage,
  type EventSchema,
} from 'src/common/event-manager';
```
