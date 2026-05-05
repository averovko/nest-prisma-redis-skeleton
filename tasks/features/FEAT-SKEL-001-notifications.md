# FEAT-SKEL-001: Notifications

## Business Context

**Problem:** The application currently has no mechanism to communicate important security and account events to users. When a user registers, requests a password reset, changes their password, or completes a password reset, they receive no confirmation or notification, leading to a poor UX and security risk (inability to detect unauthorized actions).

**Goal:** Implement an event-driven Notification module that listens for authentication domain events and dispatches transactional notifications (email and SMS) to users with well-designed, responsive HTML templates. The module must support multiple provider backends (SMTP, SendGrid, UniSender) selectable via configuration.

**Actors:**
- **End User** — receives notifications at their registered email address
- **System Administrator** — configures notification providers via environment variables

## User Stories

### US-1: Welcome + Email Verification on Registration
**As a** newly registered user, **I want to** receive a welcome email with an email verification link immediately after registration, **so that** I can verify my account and understand I have successfully signed up.

**Acceptance Criteria:**
1. [ ] On `authentication.user.registered` event, a welcome email is sent to the user's email address
2. [ ] The email contains the user's first name in a personalized greeting
3. [ ] The email contains an email verification link including a secure `verificationToken`
4. [ ] The email is rendered as responsive HTML using a Handlebars template
5. [ ] Email delivery failure does not affect the registration response

### US-2: Password Reset Request
**As a** user who has forgotten their password, **I want to** receive an email with a password reset link, **so that** I can securely reset my password.

**Acceptance Criteria:**
1. [ ] On `authentication.user.password.reset.requested` event, a password reset email is sent to the user's email address
2. [ ] The email contains a password reset link including the `rawToken`
3. [ ] The email clearly states the token/link expiry time
4. [ ] Email delivery failure does not affect the password reset initiation response

### US-3: Security Alerts on Password Changes
**As a** user, **I want to** receive an email notification when my password is changed or when a password reset is completed, **so that** I can detect unauthorized access to my account.

**Acceptance Criteria:**
1. [ ] On `authentication.user.password.changed` event, a "password changed" security alert email is sent
2. [ ] On `authentication.user.password.reset.completed` event, a "password reset successful" confirmation email is sent
3. [ ] Both emails advise the user to contact support if they did not initiate the action

## Domain Model

### Entities

| Entity | Description | Key Properties |
|--------|-------------|----------------|
| `NotificationChannel` | Enum for delivery channel | `EMAIL`, `SMS` |
| `NotificationTemplate` | Enum identifying template | `WELCOME`, `PASSWORD_RESET`, `PASSWORD_CHANGED`, `PASSWORD_RESET_COMPLETED` |

### Value Objects

| Value Object | Description | Properties |
|-------------|-------------|------------|
| `SendEmailInput` | Immutable DTO for email dispatch | `to`, `subject`, `templateName`, `context` |
| `SendSmsInput` | Immutable DTO for SMS dispatch | `to`, `body` |

## Event Catalog

### Events Consumed

| Event Name | Source Module | Reaction |
|------------|-------------|----------|
| `authentication.user.registered` | authentication | Send welcome + verification email |
| `authentication.user.password.reset.requested` | authentication | Send password reset link email |
| `authentication.user.password.changed` | authentication | Send password changed security alert |
| `authentication.user.password.reset.completed` | authentication | Send password reset success confirmation |

### Events Produced

None — the Notification module is a pure consumer.

## Required Changes to Existing Authentication Module

### Critical Payload Changes

1. **`UserPasswordResetRequestedPayload`** — add `rawToken: string` field (currently excluded from `toJSON()`)
2. **`UserRegisteredPayload`** — add `verificationToken: string` field
3. **`UserPasswordResetRequestedEvent.toJSON()`** — include `rawToken` in returned object
4. **`UserRegisteredEvent.toJSON()`** — include `verificationToken` in returned object

### New Authentication Infrastructure

5. **`EmailVerificationToken` Prisma model** — store verification tokens (analogous to `PasswordResetToken`)
6. **`EmailVerificationTokenRepositoryPort`** — domain port interface with DI token
7. **`EmailVerificationTokenRepository`** — Prisma implementation
8. **`RegisterUseCase`** — generate a `randomBytes(32).toString('hex')` verification token, hash it, persist it, include `rawToken` in event payload
9. **Remove `console.debug`** of rawToken in `initiate-password-reset.use-case.ts`

## API Contract

No REST API endpoints — this module operates exclusively via the event bus.

## Non-Functional Requirements

- **Provider Selection:** Email provider (`smtp` | `sendgrid` | `unisender` | `console`) and SMS provider (`unisender` | `console`) are configured via environment variables
- **Resilience:** Notification failures (send errors) must be caught and logged; they must NOT propagate exceptions that could disrupt the calling context
- **Templates:** All email templates must be responsive HTML, using Handlebars for variable substitution and partials for layout reuse
- **Security:** Tokens included in event payloads are acceptable for in-process `EventEmitter2`; if the event bus is ever externalized, tokens must be removed from payloads
- **Performance:** Notification delivery is asynchronous (fire-and-forget); no response-time SLA for notification delivery itself

## Error Scenarios

| Scenario | Behavior | Error Code |
|----------|----------|------------|
| Email provider unreachable | Log error, swallow exception | `NOTIFICATION_EMAIL_SEND_FAILED` |
| SMS provider unreachable | Log error, swallow exception | `NOTIFICATION_SMS_SEND_FAILED` |
| Template not found | Log error, swallow exception | `NOTIFICATION_TEMPLATE_NOT_FOUND` |
| Template render failure | Log error, swallow exception | `NOTIFICATION_TEMPLATE_RENDER_FAILED` |
| Missing required payload field | Log error, swallow exception | `NOTIFICATION_INVALID_PAYLOAD` |

## Edge Cases

- If a user has no email address in the event payload, skip email notification and log a warning
- If the SMTP server is temporarily unavailable, the error is logged but the request completes normally
- Configuration for a provider not matching any known provider name falls back to `console` provider and logs a warning

## Dependencies

- **Blocked by:** None
- **Related to:** Authentication module (SKEL-000)
- **Existing modules affected:** `authentication` (payload extension), `src/common/configuration` (new config keys), `prisma/schema.prisma` (new model)
- **New npm dependencies:** `handlebars`, `nodemailer`, `@types/nodemailer`, `@sendgrid/mail`

## Open Questions

- None — all decisions finalized via Product Owner session.
