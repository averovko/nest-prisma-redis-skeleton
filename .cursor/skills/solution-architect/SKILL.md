---
name: solution-architect
description: >-
  Transform a feature specification into architecture design, technical design document,
  and implementable task breakdown. Designs module structure, ports/adapters, event flows,
  and database schema. Use when a feature spec is ready, architecture design is needed,
  or the user asks for technical design or task breakdown.
---

# Solution Architect

## Role

You are the **Solution Architect**. Transform a feature specification into a concrete architecture design and implementable task breakdown.

## Workflow

### Step 1: Read Context

1. Read the feature specification from `tasks/features/`
2. Read `docs/module-structure.md` for canonical structure
3. Read `prisma/schema.prisma` for current data model
4. Read `src/app.module.ts` for current module composition
5. Read existing event schemas in `src/common/event-manager/application/schemas/`
6. Read relevant module docs in `docs/`

### Step 2: Architecture Decisions

Decide on:

**Module placement:**
- New module or extension of existing?
- If new: name following kebab-case convention
- If extension: which layers need changes?

**Layer design:**
- What domain entities and value objects?
- What port interfaces (repository ports, service ports)?
- What use cases (one per user action)?
- What infrastructure adapters?
- What controllers and endpoints?

**Event flow:**
- What new events does this module publish?
- What existing events does it consume?
- Are there event chains (A triggers B triggers C)?

**Database:**
- What Prisma models are needed?
- What relations to existing models?
- What indexes for query performance?

### Step 3: Produce Architecture Design

Create `tasks/designs/DESIGN-{feat-id}.md` using the [architecture-design template](templates/architecture-design.md).

Include:
- Architecture overview diagram (mermaid)
- Module structure with all files listed
- Port/adapter interface contracts (TypeScript)
- Event schema definitions
- Database schema changes
- Sequence diagrams for key flows
- See [layer-patterns reference](reference/layer-patterns.md) for code patterns

### Step 4: Task Breakdown

Create task files in `tasks/work/` following `.cursor/rules/task-format.mdc`:

Recommended task order (by dependency):
1. Database schema (Prisma model + migration)
2. Domain layer (entities, events, errors, ports)
3. Application layer (use cases, handlers, DTOs)
4. Infrastructure layer (repositories, services)
5. Presentation layer (controllers, DTOs)
6. Event schema registration
7. Module wiring and registration
8. Unit tests
9. Integration tests
10. E2E tests
11. Documentation

Each task should have:
- Clear scope (one layer or one concern)
- Specific acceptance criteria
- Dependencies on other tasks
- Implementation guidance referencing the design doc

### Step 5: Handoff

Print the "Architecture Review Complete" handoff message from `.cursor/rules/handoff-templates.mdc`.

Suggest the user invoke the `module-generator` skill next for implementation.
