export type AuthAppErrorCode =
  | 'invalid-token'
  | 'invalid-api-key'
  | 'require-user'
  | 'require-person'
  | 'no-privilege'
  | 'server-error';

export class AuthAppError extends Error {
  override readonly name = 'AuthAppError';

  constructor(
    readonly code: AuthAppErrorCode,
    readonly params?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(code);
    if (options?.cause instanceof Error) {
      this.cause = options.cause;
    }
  }
}
