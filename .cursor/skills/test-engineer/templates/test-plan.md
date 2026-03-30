# TEST-{task-id}: {Module/Feature Name} Test Plan

## Scope

**Module:** `src/{module-name}/`
**Related Design:** `tasks/designs/DESIGN-{feat-id}.md`

## Test Matrix

### Domain Layer

| Unit | Test File | Cases | Priority |
|------|-----------|-------|----------|
| `{Entity}` entity | `domain/entities/{entity}.entity.spec.ts` | {N} | High |
| `{Module}ErrorFactory` | `domain/errors/{module}.error-factory.spec.ts` | {N} | Medium |
| `{Entity}Event` classes | `domain/events/{entity}.events.spec.ts` | {N} | Medium |

### Application Layer

| Unit | Test File | Cases | Priority |
|------|-----------|-------|----------|
| `{Action}UseCase` | `application/use-cases/{action}.use-case.spec.ts` | {N} | High |
| `{Entity}ActivityHandler` | `application/handlers/{entity}-activity.handler.spec.ts` | {N} | Medium |

### Infrastructure Layer

| Unit | Test File | Cases | Priority |
|------|-----------|-------|----------|
| `{Entity}Repository` | `infrastructure/repositories/{entity}.repository.spec.ts` | {N} | Medium |

### Presentation Layer

| Unit | Test File | Cases | Priority |
|------|-----------|-------|----------|
| `{Module}Controller` | `presentation/{module}.controller.spec.ts` | {N} | High |
| E2E | `test/{module}.e2e-spec.ts` | {N} | High |

## Test Cases

### {Action}UseCase

| # | Case | Type | Input | Expected |
|---|------|------|-------|----------|
| 1 | Happy path | Success | Valid input | Returns expected output |
| 2 | Entity not found | Error | Non-existent ID | Throws ENTITY_NOT_FOUND |
| 3 | Duplicate | Error | Existing entity | Throws ENTITY_ALREADY_EXISTS |
| 4 | Event published | Event | Valid input | EventBus.publish called with correct event |

### {Module}Controller E2E

| # | Case | Method | Path | Status | Body |
|---|------|--------|------|--------|------|
| 1 | Create entity | POST | `/v1/{module}` | 201 | Valid DTO → Entity output |
| 2 | Invalid input | POST | `/v1/{module}` | 400 | Missing required field |
| 3 | Unauthorized | POST | `/v1/{module}` | 401 | No auth token |
| 4 | Get entity | GET | `/v1/{module}/:id` | 200 | Entity output |
| 5 | Not found | GET | `/v1/{module}/:id` | 404 | Non-existent ID |

## Coverage Targets

| Layer | Target | Current |
|-------|--------|---------|
| Domain | 90%+ | - |
| Application | 80%+ | - |
| Infrastructure | 70%+ | - |
| Presentation | 80%+ (via E2E) | - |
