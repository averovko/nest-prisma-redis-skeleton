import { ExecutionContext } from '@nestjs/common';

import { AppError } from 'src/common/errors/app.error';
import { AuthCtx } from '../../../domain';
import { AuthAppError } from '../../../application';
import { OptionalAuthGuard } from './optional-auth.guard';

function buildMutableRequestContext(authorizationHeader?: string): {
  request: Record<string, unknown>;
  context: ExecutionContext;
} {
  const request: Record<string, unknown> = {
    headers: { authorization: authorizationHeader },
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
  return { request, context };
}

const mockResolveAuthCtx: jest.Mocked<{
  execute: (token: string) => Promise<AuthCtx>;
}> = {
  execute: jest.fn(),
};

function buildGuard(): OptionalAuthGuard {
  return new (OptionalAuthGuard as any)(mockResolveAuthCtx);
}

describe('OptionalAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true without calling resolveAuthCtx when no Authorization header', async () => {
    const guard = buildGuard();
    const { context } = buildMutableRequestContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockResolveAuthCtx.execute).not.toHaveBeenCalled();
  });

  it('returns true without calling resolveAuthCtx when Authorization is not Bearer', async () => {
    const guard = buildGuard();
    const { context } = buildMutableRequestContext('Basic creds');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockResolveAuthCtx.execute).not.toHaveBeenCalled();
  });

  it('attaches authCtx to request and returns true when token is valid', async () => {
    const authCtx = AuthCtx.forService({ id: 'svc-1' });
    mockResolveAuthCtx.execute.mockResolvedValue(authCtx);
    const guard = buildGuard();
    const { request, context } =
      buildMutableRequestContext('Bearer valid-token');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['authCtx']).toBe(authCtx);
  });

  it('returns true silently when resolveAuthCtx throws invalid-token', async () => {
    mockResolveAuthCtx.execute.mockRejectedValue(
      new AuthAppError('invalid-token'),
    );
    const guard = buildGuard();
    const { context } = buildMutableRequestContext('Bearer bad-token');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('throws AppError when resolveAuthCtx throws non-invalid-token AuthAppError', async () => {
    mockResolveAuthCtx.execute.mockRejectedValue(
      new AuthAppError('server-error'),
    );
    const guard = buildGuard();
    const { context } = buildMutableRequestContext('Bearer token');

    await expect(guard.canActivate(context)).rejects.toThrow(AppError);
    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({ code: 'server.error' }),
    );
  });

  it('re-throws raw errors that are not AuthAppError', async () => {
    const raw = new Error('unexpected');
    mockResolveAuthCtx.execute.mockRejectedValue(raw);
    const guard = buildGuard();
    const { context } = buildMutableRequestContext('Bearer token');

    await expect(guard.canActivate(context)).rejects.toThrow(raw);
  });
});
