# Architecture Compliance Checklist

## Layer Boundaries

- [ ] **Domain layer** has no imports from `@nestjs/*` (except type-only imports)
- [ ] **Domain layer** has no imports from `infrastructure/` or `presentation/`
- [ ] **Application layer** imports only from `domain/` and `src/common/`
- [ ] **Infrastructure layer** implements domain port interfaces
- [ ] **Infrastructure layer** does not import from `presentation/`
- [ ] **Presentation layer** imports only from `application/` (use cases, DTOs)
- [ ] **Presentation layer** does not import from `infrastructure/`

## Dependency Injection

- [ ] Ports defined as interfaces with `Symbol` DI tokens
- [ ] Use cases inject ports via `@Inject(TOKEN)`, not concrete classes
- [ ] Module file binds ports to adapters: `{ provide: TOKEN, useClass: Adapter }`
- [ ] No `new ConcreteClass()` in use cases (dependency inversion)

## Module Isolation

- [ ] No direct imports between feature modules (e.g., authentication → identity)
- [ ] Cross-module communication uses event bus only
- [ ] Shared code lives in `src/common/` only
- [ ] Each module has its own error codes and error factory

## Event-Driven Patterns

- [ ] Events published from use cases, not from controllers or repositories
- [ ] Event schemas registered in `src/common/event-manager/application/schemas/`
- [ ] Event handlers in `application/handlers/` delegate to use cases
- [ ] Event handlers do not contain business logic directly
- [ ] Event names follow `{module}.{entity}.{action}` convention
- [ ] Events extend `BaseEvent<T>` with proper `toJSON()` implementation

## File Structure

- [ ] Module follows canonical structure from `docs/module-structure.md`
- [ ] File naming uses kebab-case
- [ ] One export per file
- [ ] Test files co-located with source files (`.spec.ts`)

## Common Anti-Patterns to Flag

| Anti-Pattern | What to Look For |
|-------------|-----------------|
| Leaky domain | `@Injectable()`, `@Inject()` in entity files |
| Bypassed ports | Use case importing from `infrastructure/` directly |
| God controller | Controller with business logic instead of delegating to use cases |
| Cross-module coupling | `import { ... } from 'src/{other-module}/'` (except events) |
| Circular dependency | Module A imports from Module B which imports from Module A |
| Fat event handler | Handler with more than delegation logic |
