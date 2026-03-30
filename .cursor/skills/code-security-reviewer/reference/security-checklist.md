# Security Checklist (OWASP-Aligned)

## A01: Broken Access Control

- [ ] All endpoints have appropriate `@UseGuards(AuthGuard)` where needed
- [ ] Role-based access uses `@UseGuards(RolesGuard)` with `@RequireAnyRoles(...)`
- [ ] No endpoints accidentally left public that should be protected
- [ ] Authorization checks verify the user owns the resource (not just authenticated)
- [ ] Admin-only operations properly restricted

## A02: Cryptographic Failures

- [ ] Passwords hashed with bcrypt (never stored in plain text)
- [ ] Tokens use secure algorithms (JWT with proper signing)
- [ ] No sensitive data in JWT payload (only authId, email)
- [ ] Refresh tokens stored as hashes, not plain text
- [ ] No hardcoded secrets, API keys, or credentials in source code

## A03: Injection

- [ ] All inputs validated with `class-validator` decorators on DTOs
- [ ] `ValidationPipe` with `whitelist: true` strips unknown properties
- [ ] Prisma parameterized queries used (no raw SQL string concatenation)
- [ ] No `eval()`, `new Function()`, or template literal injection
- [ ] User input never used directly in file paths or system commands

## A04: Insecure Design

- [ ] Rate limiting on authentication endpoints
- [ ] Account lockout after failed login attempts
- [ ] Password reset tokens expire within reasonable time
- [ ] No information leakage in error messages (generic "invalid credentials")
- [ ] Event handlers are idempotent (safe to process same event twice)

## A05: Security Misconfiguration

- [ ] CORS configured properly (not `*` in production)
- [ ] Helmet middleware enabled for security headers
- [ ] Debug/verbose error details not exposed in production
- [ ] Default credentials not present
- [ ] Swagger UI disabled or auth-protected in production

## A06: Vulnerable Components

- [ ] Dependencies up to date (`pnpm audit` clean)
- [ ] No known vulnerable packages
- [ ] Minimal dependencies (no unnecessary packages)

## A07: Authentication Failures

- [ ] JWT token expiration configured
- [ ] Refresh token rotation on use
- [ ] Logout invalidates refresh tokens
- [ ] Password complexity requirements enforced

## A08: Data Integrity Failures

- [ ] Event payloads validated via `class-validator` schemas
- [ ] Event version field maintained for backward compatibility
- [ ] Database constraints match domain rules
- [ ] Prisma schema has appropriate `@unique` and `@@index` constraints

## A09: Logging & Monitoring

- [ ] Authentication failures logged
- [ ] No sensitive data in log output (passwords, tokens, PII)
- [ ] Event correlation IDs used for cross-module tracing
- [ ] Error responses don't leak stack traces

## A10: SSRF

- [ ] No user-controlled URLs used in server-side HTTP requests
- [ ] External service URLs configured via environment variables only

## NestJS-Specific Checks

| Check | Details |
|-------|---------|
| `@UseFilters(GlobalErrorFilter)` | Controllers use global error filter |
| `ValidationPipe` options | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| DTO decorators | All input fields have `@IsString()`, `@IsUUID()`, etc. |
| Swagger `@ApiProperty()` | All DTO fields documented for API consumers |
| `@ErrorResponse()` | Custom error responses documented per endpoint |

## Event Security

- [ ] No passwords, tokens, or secrets in event payloads
- [ ] Event payloads contain only necessary IDs and data
- [ ] Handler errors do not block the event bus (catch and log)
- [ ] No sensitive data logged from event handlers
