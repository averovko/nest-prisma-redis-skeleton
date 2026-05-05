# Code Review: SKEL-001 Notifications

## Summary
- **Status**: APPROVED
- **Critical**: 0
- **Warning**: 2
- **Suggestion**: 3

---

## Findings

### WARNING — Tokens in Event Payload (In-Process Only)

**Files:**
- `src/common/event-manager/application/schemas/authentication.events.ts`
- `src/authentication/domain/events/user.events.ts`

**Issue:** `rawToken` (password reset token) and `verificationToken` (email verification token) are now included in the authentication event payload and transmitted over the internal event bus.

**Impact:** Currently acceptable — `EventEmitter2` is in-process and never persisted or transmitted over network. If the event bus is ever externalized (e.g. moved to Redis Streams, RabbitMQ, Kafka), these tokens would be exposed in transit or at rest in the broker.

**Recommendation:** Document this constraint in the event schema with a comment. When migrating to an external bus in the future, remove tokens from payloads and implement a separate secure delivery mechanism (e.g. direct service call or a transient token store).

---

### WARNING — All Provider Adapters Initialized at Startup Regardless of Selected Provider

**File:** `src/notification/notification.module.ts`

**Issue:** All concrete email/SMS sender services (`SmtpEmailSenderService`, `SendGridEmailSenderService`, `UniSenderEmailSenderService`, `ConsoleEmailSenderService`, `UniSenderSmsSenderService`, `ConsoleSmsSenderService`) are registered as NestJS providers and instantiated at module load time, even when only one will be used. `SmtpEmailSenderService.onModuleInit()` creates a nodemailer transporter for all environments.

**Impact:** Minor — nodemailer `createTransport()` does not open a connection immediately, only on `sendMail()`. No functional bug. Slight memory overhead.

**Recommendation:** Acceptable for now. Future improvement: use a provider factory that only instantiates the selected adapter.

---

### SUGGESTION — URL Construction Logic Duplicated Across Use Cases

**Files:**
- `src/notification/application/use-cases/send-welcome-email.use-case.ts`
- `src/notification/application/use-cases/send-password-reset-email.use-case.ts`
- `src/notification/application/use-cases/send-password-reset-completed-email.use-case.ts`

**Issue:** The pattern `new URL(frontendUrl).hostname` and URL construction from `frontendUrl` is repeated in each use case. Extracting this into a shared helper or a `NotificationConfig` value object would reduce duplication.

**Recommendation:** Consider extracting a `NotificationUrlService` or a pure utility function `buildNotificationLinks(frontendUrl, appName)` to centralize URL construction. Not blocking for v1.

---

### SUGGESTION — Template Renderer Constructor Resilience

**File:** `src/notification/infrastructure/services/template/handlebars-template-renderer.service.ts`

**Issue:** `registerPartials()` called in the constructor reads files from disk synchronously. An IO error (e.g. permissions issue in a containerized environment) would throw during NestJS bootstrapping with no contextual error message.

**Recommendation:** Wrap `registerPartials()` in a try/catch with a descriptive logger message. Or move the initialization to `onModuleInit()` so it's logged properly by Nest's lifecycle:
```typescript
onModuleInit(): void {
  try {
    this.registerPartials();
  } catch (error) {
    this.logger.error('Failed to register Handlebars partials', error);
    throw error;
  }
}
```

---

### SUGGESTION — `ConsoleEmailSenderService` HTML Body Truncation Is Lossy

**File:** `src/notification/infrastructure/services/email/console-email-sender.service.ts`

**Issue:** The HTML body is truncated to 500 characters in the log message. During development, this means the full email content is not visible in logs, making it harder to debug template rendering issues.

**Recommendation:** Log the full HTML when `LOG_LEVEL=debug` or use a structured log with separate field for the body:
```typescript
this.logger.debug({ to: options.to, subject: options.subject }, 'Console email');
this.logger.verbose(options.html);
```

---

## Architecture Compliance

- [x] Layer boundaries respected — domain has zero framework imports
- [x] Dependency direction correct — application → domain ← infrastructure
- [x] Port/adapter pattern followed — all use cases inject ports via tokens
- [x] Module isolation maintained — `NotificationModule` has no imports from `authentication` or `identity` modules
- [x] Event-driven communication — notifications triggered exclusively via `@OnEvent()` handlers
- [x] Naming conventions — ports suffixed with `Port`, adapters match names

## Security Assessment

- [x] No injection vulnerabilities — no raw SQL, no unsanitized query params; UniSender uses URLSearchParams
- [x] No hardcoded secrets — all credentials from ConfigService/env vars
- [x] No sensitive data in error messages — errors log email address but not tokens
- [x] Input validation — use cases guard against empty email before sending
- [x] Template XSS — Handlebars uses double-mustache (`{{}}`) for user-supplied data; URLs use triple-mustache (`{{{}}}`) for system-constructed URLs only
- [~] Token in event payload — acceptable for in-process bus; see WARNING above

## Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Domain error factory | 5 | ✓ |
| SendWelcomeEmailUseCase | 6 | ✓ |
| SendPasswordResetEmailUseCase | 4 | ✓ |
| SendPasswordChangedEmailUseCase | 4 | ✓ |
| SendPasswordResetCompletedEmailUseCase | 5 | ✓ |
| NotificationEventHandler | 5 | ✓ |
| HandlebarsTemplateRendererService | 8 | ✓ |
| ConsoleEmailSenderService | 2 | ✓ |
| UniSenderSmsSenderService | 4 | ✓ |
| Authentication event changes | Updated existing 99 tests | ✓ |
| **Total new/updated** | **663 passing** | **✓** |

## Final Verdict

APPROVED. The implementation correctly follows hexagonal architecture, event-driven communication, and clean code principles. No critical security issues found. The two warnings are acceptable trade-offs for v1 and are documented. The suggestions are optional improvements for future iterations.
