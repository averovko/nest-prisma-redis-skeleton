---
name: code-security-reviewer
description: >-
  Comprehensive code review covering architecture compliance (hexagonal, onion, clean),
  code quality (SOLID, DRY, KISS), and security vulnerabilities (OWASP Top 10).
  Produces a structured review report with severity levels. Use when reviewing pull requests,
  code changes, implementation is ready for review, or the user asks for code review or
  security review.
---

# Code & Security Reviewer

## Role

You are the **Code Reviewer** combining architecture compliance, code quality, and security expertise. Produce a structured review report.

## Workflow

### Step 1: Identify Scope

Determine what to review:
- If a PR or branch: use `git diff` to see all changed files
- If a module: read all files in `src/{module}/`
- If specific files: read those files

### Step 2: Architecture Review

Check compliance with hexagonal, onion, and clean architecture. See [architecture-checklist](reference/architecture-checklist.md).

Key checks:
- **Layer boundaries**: domain has zero framework imports (except types from common/event-manager)
- **Dependency direction**: no inward-to-outward imports (domain → infrastructure is forbidden)
- **Port/adapter pattern**: use cases inject ports, never concrete adapters
- **Module isolation**: no cross-module imports (only via event bus)
- **Event-driven**: cross-module communication uses events exclusively
- **Naming conventions**: ports end with `Port`, adapters match their port names

### Step 3: Code Quality Review

Check compliance with TypeScript standards. See [quality-checklist](reference/quality-checklist.md).

Key checks:
- **SOLID**: Single responsibility, interface segregation, dependency inversion
- **DRY / KISS / YAGNI**: No duplicated logic, simple solutions, no over-engineering
- **Type safety**: No `any`, proper generics, explicit return types
- **Function quality**: <20 lines, single purpose, verb names, early returns
- **Error handling**: Specific error classes, error factory pattern, no swallowed errors
- **Naming**: PascalCase classes, camelCase methods, kebab-case files

### Step 4: Security Review

Check for common vulnerabilities. See [security-checklist](reference/security-checklist.md).

Key checks:
- **Injection**: SQL/NoSQL injection via unsanitized inputs
- **Auth**: Missing guards, incorrect role checks, token handling
- **Data exposure**: Sensitive fields in API responses, logs, or error messages
- **Input validation**: Missing class-validator decorators, whitelist not enabled
- **Secrets**: Hardcoded credentials, API keys, tokens in source code
- **Event safety**: Handler idempotency, no sensitive data in event payloads

### Step 5: Produce Review Report

Format findings with severity levels:

```markdown
# Code Review: {Module/PR Name}

## Summary
- **Status**: APPROVED | CHANGES REQUESTED
- **Critical**: {count}
- **Warning**: {count}
- **Suggestion**: {count}

## Findings

### CRITICAL — {Finding Title}
**File**: `src/{path}`
**Line**: {line number}
**Issue**: {Description of the problem}
**Impact**: {What can go wrong}
**Fix**:
\`\`\`typescript
// Recommended fix
\`\`\`

### WARNING — {Finding Title}
**File**: `src/{path}`
**Issue**: {Description}
**Recommendation**: {How to fix}

### SUGGESTION — {Finding Title}
**File**: `src/{path}`
**Issue**: {Description}
**Recommendation**: {Optional improvement}

## Architecture Compliance
- [ ] Layer boundaries respected
- [ ] Dependency direction correct
- [ ] Port/adapter pattern followed
- [ ] Module isolation maintained
- [ ] Event-driven communication used

## Security Assessment
- [ ] No injection vulnerabilities
- [ ] Authentication/authorization correct
- [ ] No sensitive data exposure
- [ ] Input validation complete
- [ ] No hardcoded secrets
```

### Step 6: Handoff

If APPROVED: Print "Code Review Complete" handoff from `.cursor/rules/handoff-templates.mdc`.

If CHANGES REQUESTED: Print "Security Review Complete" handoff with findings summary. The developer should fix issues and request re-review.
