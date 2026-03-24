export type AuthDomainErrorCode =
  | 'require-user'
  | 'require-person'
  | 'no-privilege';

export class AuthDomainError extends Error {
  override readonly name = 'AuthDomainError';

  constructor(
    readonly code: AuthDomainErrorCode,
    readonly params?: Record<string, unknown>,
  ) {
    super(code);
  }
}
