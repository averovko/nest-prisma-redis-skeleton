# DESIGN-SKEL-001: Notifications Architecture

## Overview

The Notification module is a pure event-driven consumer. It listens for authentication domain events via the internal event bus and dispatches transactional notifications (email, SMS) through configurable provider adapters. It follows hexagonal, onion, and clean architecture with zero cross-module service imports.

## Architecture Layers

```
presentation → application → domain ← infrastructure
```

No presentation layer — module has no REST endpoints.

## Full Module Structure

```
src/notification/
├── notification.module.ts
├── __fixtures__/
│   └── notification.fixtures.ts
├── domain/
│   ├── entities/
│   │   ├── notification-channel.enum.ts
│   │   └── notification-template.enum.ts
│   ├── errors/
│   │   ├── index.ts
│   │   ├── notification.error-codes.ts
│   │   ├── notification.errors.ts
│   │   └── notification.error-factory.ts
│   └── ports/
│       ├── email-sender.port.ts
│       ├── sms-sender.port.ts
│       └── template-renderer.port.ts
├── application/
│   ├── dto/
│   │   ├── send-email.input.ts
│   │   └── send-sms.input.ts
│   ├── handlers/
│   │   └── notification-event.handler.ts
│   └── use-cases/
│       ├── send-welcome-email.use-case.ts
│       ├── send-password-reset-email.use-case.ts
│       ├── send-password-changed-email.use-case.ts
│       └── send-password-reset-completed-email.use-case.ts
└── infrastructure/
    ├── services/
    │   ├── email/
    │   │   ├── smtp-email-sender.service.ts
    │   │   ├── sendgrid-email-sender.service.ts
    │   │   ├── unisender-email-sender.service.ts
    │   │   └── console-email-sender.service.ts
    │   ├── sms/
    │   │   ├── unisender-sms-sender.service.ts
    │   │   └── console-sms-sender.service.ts
    │   └── template/
    │       └── handlebars-template-renderer.service.ts
    └── templates/
        ├── layouts/
        │   └── base.hbs
        └── emails/
            ├── welcome.hbs
            ├── password-reset.hbs
            ├── password-changed.hbs
            └── password-reset-completed.hbs
```

## Authentication Module Changes

### 1. Prisma Schema Addition (`prisma/schema.prisma`)

```prisma
model EmailVerificationToken {
  id            String      @id @default(uuid())
  credentialsId String      @map("credentials_id") @db.Uuid
  tokenHash     String      @map("token_hash") @db.Text
  expiresAt     DateTime    @map("expires_at") @db.Timestamptz()
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  credentials   Credentials @relation(fields: [credentialsId], references: [id], onDelete: Cascade)

  @@map("email_verification_tokens")
}
```

Add relation back-reference to `Credentials` model:
```prisma
emailVerificationTokens EmailVerificationToken[]
```

### 2. Event Payload Schema Changes (`src/common/event-manager/application/schemas/authentication.events.ts`)

```typescript
// UserRegisteredPayload — add verificationToken
export class UserRegisteredPayload extends BaseAuthenticationPayload {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  verificationToken: string;
}

// UserPasswordResetRequestedPayload — add rawToken
export class UserPasswordResetRequestedPayload extends BaseAuthenticationPayload {
  @IsEmail()
  email: string;

  @IsString()
  rawToken: string;
}
```

### 3. Domain Event Changes (`src/authentication/domain/events/user.events.ts`)

```typescript
// UserRegisteredEvent.toJSON() — include verificationToken
toJSON() {
  return this.eventPayload; // eventPayload now includes verificationToken
}

// UserPasswordResetRequestedEvent constructor — update eventPayload
this.eventPayload = {
  authId: credentials.authId,
  email: credentials.email,
  rawToken: this.rawToken,
};
```

### 4. New Port (`src/authentication/domain/ports/email-verification-token.repository.port.ts`)

```typescript
export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol('EMAIL_VERIFICATION_TOKEN_REPOSITORY');

export interface EmailVerificationTokenRepositoryPort {
  create(input: { credentialsId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  deleteAllByCredentialsId(credentialsId: string): Promise<void>;
}
```

### 5. RegisterUseCase Changes

- Generate `rawToken = randomBytes(32).toString('hex')`
- Hash it: `tokenHash = createHash('sha256').update(rawToken).digest('hex')`
- Persist via `EmailVerificationTokenRepository`
- Include `verificationToken: rawToken` in `UserRegisteredEvent` constructor

### 6. Remove console.debug from InitiatePasswordResetUseCase (line 48)

## Domain Layer Design

### Port Interfaces

```typescript
// email-sender.port.ts
export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}
export interface EmailSenderPort {
  send(options: SendEmailOptions): Promise<void>;
}

// sms-sender.port.ts
export const SMS_SENDER_PORT = Symbol('SMS_SENDER_PORT');
export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
}
export interface SmsSenderPort {
  send(options: SendSmsOptions): Promise<void>;
}

// template-renderer.port.ts
export const TEMPLATE_RENDERER_PORT = Symbol('TEMPLATE_RENDERER_PORT');
export interface TemplateRendererPort {
  render(templateName: string, context: Record<string, unknown>): Promise<string>;
}
```

### Error Codes

```typescript
export enum NotificationErrorCode {
  EMAIL_SEND_FAILED = 'NOTIFICATION_EMAIL_SEND_FAILED',
  SMS_SEND_FAILED = 'NOTIFICATION_SMS_SEND_FAILED',
  TEMPLATE_NOT_FOUND = 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  TEMPLATE_RENDER_FAILED = 'NOTIFICATION_TEMPLATE_RENDER_FAILED',
  INVALID_PAYLOAD = 'NOTIFICATION_INVALID_PAYLOAD',
}
```

## Application Layer Design

### Use Case Pattern

Each use case follows this contract:

```typescript
@Injectable()
export class SendWelcomeEmailUseCase {
  constructor(
    @Inject(EMAIL_SENDER_PORT) private readonly emailSender: EmailSenderPort,
    @Inject(TEMPLATE_RENDERER_PORT) private readonly templateRenderer: TemplateRendererPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: SendWelcomeEmailInput): Promise<void> {
    const html = await this.templateRenderer.render('emails/welcome', {
      firstName: input.firstName,
      verificationLink: `${this.configService.get('notification.frontendUrl')}/verify-email?token=${input.verificationToken}`,
      appName: this.configService.get('notification.appName'),
    });

    await this.emailSender.send({
      to: input.email,
      subject: `Welcome to ${this.configService.get('notification.appName')}`,
      html,
    });
  }
}
```

**Error handling:** All use cases must wrap `send()` and `render()` calls in try/catch, log errors, and swallow them. Notification failures must NEVER propagate.

### Event Handler Pattern

```typescript
@Injectable()
export class NotificationEventHandler {
  @OnEvent(AuthenticationEventSchemas.USER_REGISTERED.eventName)
  async handleUserRegistered(message: EventBusMessage<UserRegisteredPayload>): Promise<void> {
    await this.sendWelcomeEmailUseCase.execute(message.payload);
  }

  @OnEvent(AuthenticationEventSchemas.USER_PASSWORD_RESET_REQUESTED.eventName)
  async handlePasswordResetRequested(message: EventBusMessage<UserPasswordResetRequestedPayload>): Promise<void> {
    await this.sendPasswordResetEmailUseCase.execute(message.payload);
  }
  // ...
}
```

## Infrastructure Layer Design

### Email Adapters

| Adapter | Technology | Config Keys |
|---------|-----------|-------------|
| `SmtpEmailSenderService` | `nodemailer` | `notification.email.smtp.*` |
| `SendGridEmailSenderService` | `@sendgrid/mail` | `notification.email.sendgrid.apiKey` |
| `UniSenderEmailSenderService` | UniSender REST API | `notification.email.unisender.apiKey` |
| `ConsoleEmailSenderService` | `console.log` | None |

### SMS Adapters

| Adapter | Technology | Config Keys |
|---------|-----------|-------------|
| `UniSenderSmsSenderService` | UniSender REST API | `notification.sms.unisender.apiKey` |
| `ConsoleSmsSenderService` | `console.log` | None |

### Template Renderer

`HandlebarsTemplateRendererService` resolves templates relative to `infrastructure/templates/`. Registers `layouts/base` as a layout partial. Templates use `{{{body}}}` slot in base layout.

Template file path resolution: `{templateName}.hbs` relative to `templates/` directory.

## Configuration Design

New section in `src/common/configuration/configuration.ts`:

```typescript
notification: {
  email: {
    provider: process.env.NOTIFICATION_EMAIL_PROVIDER || 'console',
    from: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@example.com',
    smtp: {
      host: process.env.NOTIFICATION_SMTP_HOST || 'localhost',
      port: process.env.NOTIFICATION_SMTP_PORT ? parseInt(process.env.NOTIFICATION_SMTP_PORT, 10) : 587,
      secure: process.env.NOTIFICATION_SMTP_SECURE === 'true',
      user: process.env.NOTIFICATION_SMTP_USER || '',
      pass: process.env.NOTIFICATION_SMTP_PASS || '',
    },
    sendgrid: {
      apiKey: process.env.NOTIFICATION_SENDGRID_API_KEY || '',
    },
    unisender: {
      apiKey: process.env.NOTIFICATION_UNISENDER_API_KEY || '',
    },
  },
  sms: {
    provider: process.env.NOTIFICATION_SMS_PROVIDER || 'console',
    unisender: {
      apiKey: process.env.NOTIFICATION_UNISENDER_API_KEY || '',
      senderName: process.env.NOTIFICATION_SMS_SENDER_NAME || 'App',
    },
  },
  frontendUrl: process.env.FRONTEND_URL || 'https://example.com',
},
```

## Module Wiring Design

`NotificationModule` uses factory providers to select adapters:

```typescript
{
  provide: EMAIL_SENDER_PORT,
  useFactory: (config: ConfigService, smtp: SmtpEmailSenderService, sendgrid: SendGridEmailSenderService, unisender: UniSenderEmailSenderService, console: ConsoleEmailSenderService) => {
    const provider = config.get<string>('notification.email.provider', 'console');
    switch (provider) {
      case 'smtp': return smtp;
      case 'sendgrid': return sendgrid;
      case 'unisender': return unisender;
      default: return console;
    }
  },
  inject: [ConfigService, SmtpEmailSenderService, SendGridEmailSenderService, UniSenderEmailSenderService, ConsoleEmailSenderService],
}
```

## Event Flow (End-to-End)

```
1. RegisterUseCase.execute()
   ├── Creates credentials
   ├── Generates verificationToken (randomBytes)
   ├── Hashes and persists EmailVerificationToken
   └── Publishes UserRegisteredEvent { authId, email, firstName, verificationToken }

2. EventBusAdapter.publish()
   ├── Validates payload (class-validator)
   ├── Builds EventBusMessage
   └── EventEmitter2.emitAsync('authentication.user.registered', message)

3. NotificationEventHandler.handleUserRegistered(message)
   └── SendWelcomeEmailUseCase.execute(message.payload)
       ├── HandlebarsTemplateRendererService.render('emails/welcome', context)
       └── [SelectedEmailAdapter].send({ to, subject, html })
```

## Task Breakdown

### TASK-SKEL-001-01: Extend Authentication Event Payloads
- Files: `prisma/schema.prisma`, `authentication.events.ts`, `user.events.ts`, `register.use-case.ts`, `initiate-password-reset.use-case.ts`
- New files: `email-verification-token.repository.port.ts`, `email-verification-token.repository.ts`
- Migration: `pnpm prisma migrate dev --name add_email_verification_token`

### TASK-SKEL-001-02: Notification Domain Layer
- Files: enums, error codes/classes/factory, port interfaces

### TASK-SKEL-001-03: Handlebars Template Renderer + Templates
- Files: `handlebars-template-renderer.service.ts`, 4 email templates + base layout

### TASK-SKEL-001-04: Email Adapters
- Files: 4 email sender services (smtp, sendgrid, unisender, console)

### TASK-SKEL-001-05: SMS Adapters
- Files: 2 SMS sender services (unisender, console)

### TASK-SKEL-001-06: Use Cases + Event Handler
- Files: 4 use cases, 1 handler, 2 DTOs

### TASK-SKEL-001-07: Module Wiring + Configuration
- Files: `notification.module.ts`, `configuration.ts` update, `app.module.ts` update, `.env` additions

## Non-Functional Architecture Notes

- Notification failures are **non-fatal**: all use cases swallow errors after logging
- No Prisma dependency in notification module (fire-and-forget, no persistence yet)
- Template files shipped as part of the compiled output (must be in `dist/`); use `assets` in `nest-cli.json` or read from source path
- `HandlebarsTemplateRendererService` caches compiled templates on first load for performance
