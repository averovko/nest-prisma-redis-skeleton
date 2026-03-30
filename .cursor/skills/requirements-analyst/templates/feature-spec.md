# FEAT-{id}: {Feature Name}

## Business Context

**Problem:** {What problem does this feature solve?}

**Goal:** {What is the desired outcome?}

**Actors:** {Who uses this feature? List roles.}

## User Stories

### US-1: {Story Title}
**As a** {role}, **I want to** {action}, **so that** {benefit}.

**Acceptance Criteria:**
1. [ ] {Criteria 1}
2. [ ] {Criteria 2}
3. [ ] {Criteria 3}

### US-2: {Story Title}
**As a** {role}, **I want to** {action}, **so that** {benefit}.

**Acceptance Criteria:**
1. [ ] {Criteria 1}
2. [ ] {Criteria 2}

## Domain Model

### Entities
| Entity | Description | Key Properties |
|--------|-------------|----------------|
| {EntityName} | {Description} | {prop1, prop2, ...} |

### Value Objects
| Value Object | Description | Properties |
|-------------|-------------|------------|
| {VOName} | {Description} | {prop1, prop2} |

## Event Catalog

### Events Produced
| Event Name | Trigger | Payload |
|------------|---------|---------|
| `{module}.{entity}.{action}` | {When emitted} | `{PayloadClass}` |

### Events Consumed
| Event Name | Source Module | Reaction |
|------------|-------------|----------|
| `{module}.{entity}.{action}` | {Module} | {What happens} |

## API Contract

### Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/v1/{module}/{action}` | {Description} | {Role(s)} |
| GET | `/v1/{module}/{resource}` | {Description} | {Role(s)} |

### Request/Response Schemas

**POST /v1/{module}/{action}**
```typescript
// Request
interface CreateEntityInput {
  field1: string;
  field2: number;
}

// Response (201)
interface EntityOutput {
  id: string;
  field1: string;
  createdAt: string;
}
```

## Non-Functional Requirements

- **Authentication:** {Required roles or public access}
- **Performance:** {Response time targets, throughput}
- **Validation:** {Input validation rules}
- **Rate Limiting:** {If applicable}

## Error Scenarios

| Scenario | HTTP Status | Error Code | Description |
|----------|-------------|------------|-------------|
| {Scenario} | {4xx} | {MODULE_ERROR_CODE} | {Description} |

## Edge Cases

- {Edge case 1 and expected behavior}
- {Edge case 2 and expected behavior}

## Dependencies

- **Blocked by:** {Other features or infrastructure needed}
- **Related to:** {Related features or modules}
- **Existing modules affected:** {Modules that need changes}

## Open Questions

- {Any unresolved decisions — mark as [TBD] in relevant sections}
