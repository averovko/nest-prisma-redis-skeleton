import { ExecutionContext } from '@nestjs/common';

import { AppError } from 'src/common/errors/app.error';
import { AuthCtx } from '../../../domain';
import { AuthAppError, RESOLVE_AUTH_CTX_USE_CASE } from '../../../application';
import { JWTGuard } from './jwt.guard';

function buildMockContext(authorizationHeader?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authorizationHeader },
        authCtx: undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

function buildMutableRequestContext(
  authorizationHeader?: string,
  requestContext?: Record<string, unknown>,
): {
  request: Record<string, unknown>;
  context: ExecutionContext;
} {
  const request: Record<string, unknown> = {
    headers: { authorization: authorizationHeader },
    requestContext,
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

function buildGuard(): JWTGuard {
  return new (JWTGuard as any)(mockResolveAuthCtx);
}

describe('JWTGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws AppError auth.invalid-token when Authorization header is missing', async () => {
    const guard = buildGuard();

    await expect(guard.canActivate(buildMockContext())).rejects.toThrow(
      AppError,
    );
    await expect(guard.canActivate(buildMockContext())).rejects.toThrow(
      expect.objectContaining({ code: 'auth.invalid-token' }),
    );
  });

  it('throws AppError auth.invalid-token when Authorization type is not Bearer', async () => {
    const guard = buildGuard();

    await expect(
      guard.canActivate(buildMockContext('Basic credentials')),
    ).rejects.toThrow(expect.objectContaining({ code: 'auth.invalid-token' }));
  });

  it('resolves authCtx and attaches it to request when token is valid', async () => {
    const authCtx = AuthCtx.forService({ id: 'svc-1' });
    mockResolveAuthCtx.execute.mockResolvedValue(authCtx);
    const guard = buildGuard();
    const { request, context } = buildMutableRequestContext(
      'Bearer valid-token',
      {
        ipAddress: '10.0.0.1',
        userAgent: 'TestAgent',
      },
    );

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['authCtx']).toBeInstanceOf(AuthCtx);
    expect((request['authCtx'] as AuthCtx).getRequestContext()).toEqual({
      ipAddress: '10.0.0.1',
      userAgent: 'TestAgent',
    });
    expect(mockResolveAuthCtx.execute).toHaveBeenCalledWith('valid-token');
  });

  it('uses empty requestContext when middleware did not set it', async () => {
    const authCtx = AuthCtx.forService({ id: 'svc-2' });
    mockResolveAuthCtx.execute.mockResolvedValue(authCtx);
    const guard = buildGuard();
    const { request, context } = buildMutableRequestContext(
      'Bearer valid-token',
      undefined,
    );

    await guard.canActivate(context);

    expect((request['authCtx'] as AuthCtx).getRequestContext()).toEqual({});
  });

  it('throws mapped AppError when resolveAuthCtx throws AuthAppError', async () => {
    mockResolveAuthCtx.execute.mockRejectedValue(
      new AuthAppError('server-error'),
    );
    const guard = buildGuard();

    await expect(
      guard.canActivate(buildMockContext('Bearer token')),
    ).rejects.toThrow(AppError);
    await expect(
      guard.canActivate(buildMockContext('Bearer token')),
    ).rejects.toThrow(expect.objectContaining({ code: 'server.error' }));
  });

  it('re-throws non-AuthAppError errors as-is', async () => {
    const raw = new Error('db-down');
    mockResolveAuthCtx.execute.mockRejectedValue(raw);
    const guard = buildGuard();

    await expect(
      guard.canActivate(buildMockContext('Bearer token')),
    ).rejects.toThrow(raw);
  });

  it('injects RESOLVE_AUTH_CTX_USE_CASE via NestJS @Inject metadata', () => {
    const injectMeta: Array<{ index: number; param: symbol }> =
      Reflect.getMetadata('self:paramtypes', JWTGuard) ?? [];

    expect(injectMeta.some((m) => m.param === RESOLVE_AUTH_CTX_USE_CASE)).toBe(
      true,
    );
  });
});
