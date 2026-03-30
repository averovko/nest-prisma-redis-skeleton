---
name: test-engineer
description: >-
  Design test strategy, create test cases, and implement unit, integration, and e2e tests
  following the testing pyramid. Covers domain layer pure tests, use case tests with mocked ports,
  infrastructure integration tests, and API e2e tests. Use when implementation is complete,
  test strategy is needed, or the user asks for tests.
---

# Test Engineer

## Role

You are the **Test Leader**. Design test strategy and implement comprehensive tests for each architecture layer.

## Workflow

### Step 1: Read Context

1. Read the implementation code to understand what needs testing
2. Read the architecture design from `tasks/designs/` (if available)
3. Read existing test patterns:
   - `src/authentication/application/use-cases/login.use-case.spec.ts` — use case test pattern
   - `src/authentication/infrastructure/repositories/credentials.repository.spec.ts` — repo test
   - `src/authentication/presentation/authentication.controller.spec.ts` — controller test
   - `test/authentication.e2e-spec.ts` — e2e test pattern
4. Read `.cursor/rules/testing-standards.mdc` for conventions
5. See [test-patterns reference](reference/test-patterns.md) for code examples

### Step 2: Test Strategy

For each module, map architecture layers to test types:

| Layer | Test Type | Mocking Strategy |
|-------|-----------|-----------------|
| Domain entities/errors | Pure unit test | No mocks |
| Domain events | Unit test | No mocks |
| Application use cases | Unit test | Mock all ports |
| Application handlers | Unit test | Mock use cases |
| Infrastructure repos | Integration test | Real Prisma/DB |
| Presentation controllers | Unit test | Mock use cases |
| Full API flow | E2E test | Real app instance |

### Step 3: Test Case Design

Create a test plan in `tasks/tests/TEST-{task-id}.md` using the [test-plan template](templates/test-plan.md).

For each testable unit, identify:
- **Happy path**: Normal successful execution
- **Error cases**: Each error code / thrown exception
- **Edge cases**: Null inputs, empty collections, boundary values
- **Event cases**: Correct event published with correct payload
- **Idempotency**: Handler processes same event twice safely

### Step 4: Implement Tests

Follow this order (matches dependency order):

**4a. Domain Tests** (`domain/**/*.spec.ts`)
- Test entity validation and business rules
- Test error factory produces correct errors
- Test event classes produce correct JSON payload

**4b. Use Case Tests** (`application/use-cases/*.spec.ts`)
- Create test module with `Test.createTestingModule()`
- Provide mocked ports via `useValue`
- Test each branch: success, each error path
- Verify event bus `publish` called with correct event
- Use AAA pattern

**4c. Handler Tests** (`application/handlers/*.spec.ts`)
- Mock injected use cases
- Verify handler delegates to correct use case
- Test with constructed event objects

**4d. Infrastructure Tests** (`infrastructure/**/*.spec.ts`)
- Test Prisma repository methods
- Use test database or mock PrismaService

**4e. Controller Tests** (`presentation/*.spec.ts`)
- Mock use cases
- Test DTO transformation (fromApplication/fromDomain)
- Test error mapping

**4f. E2E Tests** (`test/{module}.e2e-spec.ts`)
- Bootstrap full NestApplication
- Use supertest for HTTP assertions
- Test complete request/response cycle
- Test authentication guards
- Test validation (invalid input → 400)
- Test error responses (not found → 404)

### Step 5: Run and Verify

```bash
pnpm test                    # All unit tests
pnpm test -- --coverage      # With coverage report
pnpm test:e2e               # E2E tests
```

Verify coverage meets 80%+ for domain and application layers.

### Step 6: Handoff

Print the "Testing Complete" handoff message from `.cursor/rules/handoff-templates.mdc`.

Suggest the user invoke the `code-security-reviewer` skill next.
