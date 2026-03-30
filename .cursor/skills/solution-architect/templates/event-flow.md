# Event Flow: {Feature Name}

## Event Catalog

### New Events

| Event Name | Module | Payload Class | Trigger | Version |
|------------|--------|---------------|---------|---------|
| `{module}.{entity}.{action}` | {module} | `{Entity}{Action}Payload` | {When emitted} | 1.0.0 |

### Consumed Events

| Event Name | Source Module | Handler Class | Reaction |
|------------|-------------|---------------|----------|
| `{source}.{entity}.{action}` | {source-module} | `{Entity}ActivityHandler` | {What happens} |

## Flow Diagrams

### {Flow Name}

```mermaid
sequenceDiagram
    participant Publisher as {Source Module}
    participant EB as EventBus
    participant Handler as {Target Handler}
    participant UC as {Target UseCase}
    participant Repo as {Target Repository}

    Publisher->>EB: publish({EventClass})
    EB->>Handler: @OnEvent('{event.name}')
    Handler->>UC: execute(event)
    UC->>Repo: {action}(data)
```

## Idempotency Strategy

| Event | Idempotency Key | Strategy |
|-------|----------------|----------|
| `{event.name}` | `eventId` | {Upsert / Check-before-write / Dedup table} |

## Error Handling

| Event | Failure Scenario | Recovery |
|-------|-----------------|----------|
| `{event.name}` | {What can go wrong} | {Log + retry / Dead letter / Compensating event} |
