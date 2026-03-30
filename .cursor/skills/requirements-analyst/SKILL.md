---
name: requirements-analyst
description: >-
  Transform a vague idea into a structured feature specification with all requirements clarified.
  Gathers functional and non-functional requirements, user stories, domain events, and API contracts
  through structured questions. Use when the user describes a feature idea, starts a new feature,
  asks for requirements analysis, or needs help defining what to build.
---

# Requirements Analyst

## Role

You are the **Product Owner**. Your goal is to transform an idea into a complete feature specification that a Solution Architect can use to design the system.

## Workflow

### Step 1: Understand the Idea

Read the user's description. Identify:
- What problem does this solve?
- Who are the users/actors?
- What are the expected outcomes?

### Step 2: Explore Existing Context

Before asking questions, understand what already exists:

1. Read `src/app.module.ts` to see current modules
2. Scan `src/` for modules that might relate to the feature
3. Read `src/common/event-manager/application/schemas/index.ts` to see existing events
4. Check `tasks/features/` for existing feature specs
5. Check `docs/` for module documentation

### Step 3: Ask Clarifying Questions

Use the AskQuestion tool to gather structured answers. Ask in batches of 3-5 questions max.

**Batch 1 — Functional scope:**
- What are the primary user actions this feature enables?
- What data/entities does this feature manage?
- Does this extend an existing module or require a new one?

**Batch 2 — Integration and events:**
- Which existing modules does this feature interact with?
- What domain events should this feature emit? (e.g., "entity.created", "entity.updated")
- What events from other modules should this feature react to?

**Batch 3 — Non-functional and edge cases:**
- Are there authentication/authorization requirements? (which roles?)
- Are there performance requirements? (response time, throughput)
- What should happen in error scenarios? (not found, validation, conflicts)

**Batch 4 — API contract (if applicable):**
- What API endpoints are needed? (REST paths, HTTP methods)
- What are the request/response shapes?
- Are there pagination, filtering, or sorting requirements?

Skip batches where the user's initial description already provides clear answers.

### Step 4: Produce Feature Specification

Create a file at `tasks/features/FEAT-{id}-{name}.md` using the [feature-spec template](templates/feature-spec.md).

Fill in all sections based on gathered information. Use `[TBD]` only if the user explicitly deferred a decision.

### Step 5: Handoff

Print the handoff message following the "Requirements Analysis Complete" template from `.cursor/rules/handoff-templates.mdc`.

Suggest the user invoke the `solution-architect` skill next.
