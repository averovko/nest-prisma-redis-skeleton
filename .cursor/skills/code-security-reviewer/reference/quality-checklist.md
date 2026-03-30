# Code Quality Checklist

## SOLID Principles

### Single Responsibility
- [ ] Each class has one reason to change
- [ ] Use cases contain only business logic orchestration
- [ ] Controllers only handle HTTP concerns (validation, transformation, response)
- [ ] Repositories only handle data persistence
- [ ] Event handlers only delegate to use cases

### Open/Closed
- [ ] New behavior added by implementing interfaces, not modifying existing code
- [ ] Port/adapter pattern allows swapping implementations without changing use cases
- [ ] Error codes extendable via enum without changing error handling logic

### Liskov Substitution
- [ ] All adapter implementations fully satisfy their port interfaces
- [ ] No methods throw "not implemented" exceptions
- [ ] Subclasses (if any) don't violate parent contracts

### Interface Segregation
- [ ] Port interfaces are small and focused
- [ ] No "fat" interfaces that force adapters to implement unused methods
- [ ] Separate ports for separate concerns (repository vs service)

### Dependency Inversion
- [ ] Use cases depend on port interfaces, not concrete classes
- [ ] DI tokens (Symbols) used for all port bindings
- [ ] No `new ConcreteAdapter()` in application or domain layers

## Code Style

### Naming
- [ ] Classes: PascalCase (`LoginUseCase`, `CredentialsRepository`)
- [ ] Methods/variables: camelCase (`findByEmail`, `isVerified`)
- [ ] Files: kebab-case (`login.use-case.ts`, `credentials.repository.port.ts`)
- [ ] Constants: UPPER_SNAKE_CASE (`CREDENTIALS_REPOSITORY`, `EVENT_BUS_TOKEN`)
- [ ] Boolean variables: `isX`, `hasX`, `canX`
- [ ] Functions start with verb: `create`, `find`, `validate`, `execute`

### Functions
- [ ] Less than 20 instructions per function
- [ ] Single purpose per function
- [ ] Early returns to avoid nesting
- [ ] No more than 3 levels of nesting
- [ ] Default parameter values used where appropriate

### Types
- [ ] No `any` type (use `unknown` if type is truly unknown)
- [ ] Explicit return types on all public methods
- [ ] Readonly properties for immutable data
- [ ] Proper generics instead of type assertions

### Error Handling
- [ ] Module-specific error codes as string enum
- [ ] Error factory with descriptive static methods
- [ ] No generic `throw new Error('...')`
- [ ] No empty catch blocks
- [ ] Error context preserved when re-throwing

## DRY / KISS / YAGNI

- [ ] No duplicated logic across use cases (extract to shared utility if needed)
- [ ] No over-abstraction (if only used once, inline is fine)
- [ ] No features or code paths that aren't required by current tasks
- [ ] Simple conditionals preferred over complex patterns

## Testing Quality

- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Variable naming: `sut`, `input{X}`, `mock{X}`, `expected{X}`, `actual{X}`
- [ ] Each test tests one behavior
- [ ] Tests are independent (no shared mutable state)
- [ ] Edge cases covered (null, empty, boundary values)
- [ ] Error paths tested (not just happy path)

## Documentation

- [ ] JSDoc on public classes and methods
- [ ] Swagger decorators on all controller endpoints
- [ ] All DTO fields have `@ApiProperty()` decorators
- [ ] Module documented in `docs/` if it's a new module
