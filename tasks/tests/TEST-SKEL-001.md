# TEST-SKEL-001: Notifications Test Strategy

## Overview

This document defines the test strategy for the SKEL-001 Notifications feature. All tests follow the AAA (Arrange-Act-Assert) pattern and Given-When-Then naming.

## Test Pyramid

```
         /  E2E  \
        / (future)\
       /____________\
      / Integration  \
     /  (future SMTP) \
    /___________________\
   /    Unit Tests       \
  /_______________________\
```

## Unit Tests

### 1. Domain Layer

#### `NotificationErrorFactory`
- Creates `NotificationError` with correct code, message, and cause for each error type

### 2. Application Layer — Use Cases

Each use case verifies:
- Renders the correct template with correct context variables
- Calls `emailSender.send()` with correct `to`, `subject`, and rendered `html`
- Gracefully handles errors (swallows them, logs, does NOT rethrow)
- Skips sending if email is missing

#### `SendWelcomeEmailUseCase`
- Renders `emails/welcome` template with firstName, verificationLink, appName
- Builds correct verificationLink from frontendUrl + token
- Swallows errors from `emailSender.send()`
- Swallows errors from `templateRenderer.render()`

#### `SendPasswordResetEmailUseCase`
- Renders `emails/password-reset` template with email, resetLink, appName
- Builds correct resetLink from frontendUrl + rawToken
- Swallows errors from `emailSender.send()`

#### `SendPasswordChangedEmailUseCase`
- Renders `emails/password-changed` template with email, changedAt, ipAddress
- Uses event timestamp as `changedAt` if provided
- Uses 'Unknown' for ipAddress if not provided
- Swallows errors

#### `SendPasswordResetCompletedEmailUseCase`
- Renders `emails/password-reset-completed` template with email, completedAt, ipAddress, loginLink
- Builds correct loginLink from frontendUrl

### 3. Application Layer — Event Handler

#### `NotificationEventHandler`
- `handleUserRegistered` → delegates to `SendWelcomeEmailUseCase` with correct payload mapping
- `handlePasswordResetRequested` → delegates to `SendPasswordResetEmailUseCase` with correct payload mapping
- `handlePasswordChanged` → delegates to `SendPasswordChangedEmailUseCase` with correct payload mapping, extracts ipAddress from metadata
- `handlePasswordResetCompleted` → delegates to `SendPasswordResetCompletedEmailUseCase` with correct payload mapping

### 4. Infrastructure Layer — Template Renderer

#### `HandlebarsTemplateRendererService`
- Renders known templates without error
- Throws `NOTIFICATION_TEMPLATE_NOT_FOUND` for unknown template names
- Caches compiled templates (second render uses cached version)
- Registers base layout partial on construction

### 5. Infrastructure Layer — Email Adapters

#### `ConsoleEmailSenderService`
- Logs to Logger without throwing

#### `SmtpEmailSenderService`
- Calls `transporter.sendMail()` with correct params
- Throws `NotificationError` with `EMAIL_SEND_FAILED` code when SMTP fails

#### `SendGridEmailSenderService`
- Calls `sgMail.send()` with correct params
- Throws `NotificationError` with `EMAIL_SEND_FAILED` code when SendGrid fails

#### `UniSenderEmailSenderService`
- Calls UniSender REST API with correct query parameters
- Throws `NotificationError` with `EMAIL_SEND_FAILED` code on HTTP error

### 6. Infrastructure Layer — SMS Adapters

#### `ConsoleSmsSenderService`
- Logs to Logger without throwing

#### `UniSenderSmsSenderService`
- Calls UniSender SMS REST API with correct params
- Throws `NotificationError` with `SMS_SEND_FAILED` code on HTTP error

## Coverage Target

- 80%+ line coverage per project convention
- All error paths covered

## Test File Locations

| Component | Test File |
|-----------|-----------|
| Domain errors | `notification/domain/errors/notification.error-factory.spec.ts` |
| SendWelcomeEmailUseCase | `notification/application/use-cases/send-welcome-email.use-case.spec.ts` |
| SendPasswordResetEmailUseCase | `notification/application/use-cases/send-password-reset-email.use-case.spec.ts` |
| SendPasswordChangedEmailUseCase | `notification/application/use-cases/send-password-changed-email.use-case.spec.ts` |
| SendPasswordResetCompletedEmailUseCase | `notification/application/use-cases/send-password-reset-completed-email.use-case.spec.ts` |
| NotificationEventHandler | `notification/application/handlers/notification-event.handler.spec.ts` |
| HandlebarsTemplateRendererService | `notification/infrastructure/services/template/handlebars-template-renderer.service.spec.ts` |
| ConsoleEmailSenderService | `notification/infrastructure/services/email/console-email-sender.service.spec.ts` |
| SmtpEmailSenderService | `notification/infrastructure/services/email/smtp-email-sender.service.spec.ts` |
| UniSenderSmsSenderService | `notification/infrastructure/services/sms/unisender-sms-sender.service.spec.ts` |
