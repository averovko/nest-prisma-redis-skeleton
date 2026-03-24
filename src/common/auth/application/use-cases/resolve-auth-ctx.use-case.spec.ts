import { AuthCtx } from '../../domain';
import { Role } from '../../domain';
import { AuthAppError } from '../errors/auth-app-error';
import type { AuthTokenPort } from '../ports/auth-token.port';
import type { UserLookupPort } from '../ports/user-lookup.port';
import type { AuthCtxCachePort } from '../ports/auth-ctx-cache.port';
import type { CachePolicyPort } from '../ports/cache-policy.port';
import type { TokenPayload } from '../dto/token-payload';
import type { User } from '../../domain';
import { ResolveAuthCtxUseCase } from './resolve-auth-ctx.use-case';

const inputToken = 'header.payload.signature';

const mockPayload: TokenPayload = {
  sub: 'auth-1',
  email: 'a@b.com',
  phone: '+1',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const mockUser: User = {
  id: 'usr-1',
  authId: 'auth-1',
  email: 'a@b.com',
  phone: '+1',
  firstName: 'Alice',
  lastName: null,
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

function createMocks(): {
  authTokenPort: jest.Mocked<AuthTokenPort>;
  userLookupPort: jest.Mocked<UserLookupPort>;
  authCtxCachePort: jest.Mocked<AuthCtxCachePort>;
  cachePolicyPort: jest.Mocked<CachePolicyPort>;
} {
  return {
    authTokenPort: { resolvePayload: jest.fn() },
    userLookupPort: { findByAuthId: jest.fn() },
    authCtxCachePort: { getByToken: jest.fn(), setByToken: jest.fn() },
    cachePolicyPort: { getDefaultTtlMs: jest.fn(), getMaxTtlMs: jest.fn() },
  };
}

describe('ResolveAuthCtxUseCase', () => {
  it('returns cached AuthCtx when cache hit', async () => {
    const mocks = createMocks();
    const expectedCtx = AuthCtx.forPerson({ authId: 'auth-1' }, mockUser);
    mocks.authCtxCachePort.getByToken.mockResolvedValue(expectedCtx);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    const actual = await useCase.execute(inputToken);

    expect(actual).toBe(expectedCtx);
    expect(mocks.authTokenPort.resolvePayload).not.toHaveBeenCalled();
  });

  it('resolves token, looks up user, and returns AuthCtx on cache miss', async () => {
    const mocks = createMocks();
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(mockPayload);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(mockUser);
    mocks.cachePolicyPort.getDefaultTtlMs.mockReturnValue(900_000);
    mocks.cachePolicyPort.getMaxTtlMs.mockReturnValue(3_600_000);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    const actual = await useCase.execute(inputToken);

    expect(actual.isPerson()).toBe(true);
    expect(actual.isUser()).toBe(true);
    expect(actual.getPerson()?.authId).toBe('auth-1');
    expect(actual.getUser()).toEqual(mockUser);
  });

  it('caches the result when user is present', async () => {
    const mocks = createMocks();
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(mockPayload);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(mockUser);
    mocks.cachePolicyPort.getDefaultTtlMs.mockReturnValue(900_000);
    mocks.cachePolicyPort.getMaxTtlMs.mockReturnValue(3_600_000);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await useCase.execute(inputToken);

    expect(mocks.authCtxCachePort.setByToken).toHaveBeenCalledTimes(1);
    expect(mocks.authCtxCachePort.setByToken).toHaveBeenCalledWith(
      inputToken,
      expect.any(AuthCtx),
      expect.any(Number),
    );
  });

  it('does not cache when user is absent (person-only)', async () => {
    const mocks = createMocks();
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(mockPayload);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(undefined);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    const actual = await useCase.execute(inputToken);

    expect(actual.isPerson()).toBe(true);
    expect(actual.isUser()).toBe(false);
    expect(mocks.authCtxCachePort.setByToken).not.toHaveBeenCalled();
  });

  it('caps TTL to maxTtlMs', async () => {
    const mocks = createMocks();
    const farFuturePayload: TokenPayload = {
      ...mockPayload,
      exp: Math.floor(Date.now() / 1000) + 999_999,
    };
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(farFuturePayload);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(mockUser);
    mocks.cachePolicyPort.getDefaultTtlMs.mockReturnValue(900_000);
    mocks.cachePolicyPort.getMaxTtlMs.mockReturnValue(60_000);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await useCase.execute(inputToken);

    const actualTtl = mocks.authCtxCachePort.setByToken.mock.calls[0][2];
    expect(actualTtl).toBeLessThanOrEqual(60_000);
  });

  it('re-throws AuthAppError from authTokenPort as-is', async () => {
    const mocks = createMocks();
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockRejectedValue(
      new AuthAppError('invalid-token'),
    );
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await expect(useCase.execute(inputToken)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-token' }),
    );
  });

  it('wraps unexpected errors as server-error', async () => {
    const mocks = createMocks();
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockRejectedValue(new Error('network'));
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await expect(useCase.execute(inputToken)).rejects.toThrow(AuthAppError);
    await expect(useCase.execute(inputToken)).rejects.toThrow(
      expect.objectContaining({ code: 'server-error' }),
    );
  });

  it('uses default TTL when token has no exp claim', async () => {
    const mocks = createMocks();
    const payloadNoExp: TokenPayload = { sub: 'auth-1', email: 'a@b.com' };
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(payloadNoExp);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(mockUser);
    mocks.cachePolicyPort.getDefaultTtlMs.mockReturnValue(900_000);
    mocks.cachePolicyPort.getMaxTtlMs.mockReturnValue(3_600_000);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await useCase.execute(inputToken);

    const actualTtl = mocks.authCtxCachePort.setByToken.mock.calls[0][2];
    expect(actualTtl).toBe(900_000);
  });

  it('shouldCache returns true for a service context (private method coverage)', () => {
    const mocks = createMocks();
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );
    const serviceCtx = AuthCtx.forService({ id: 'svc-1' });

    expect((useCase as any).shouldCache(serviceCtx)).toBe(true);
  });

  it('does not cache when token is already expired (TTL would be 0)', async () => {
    const mocks = createMocks();
    const expiredPayload: TokenPayload = {
      ...mockPayload,
      exp: Math.floor(Date.now() / 1000) - 60,
    };
    mocks.authCtxCachePort.getByToken.mockResolvedValue(null);
    mocks.authTokenPort.resolvePayload.mockResolvedValue(expiredPayload);
    mocks.userLookupPort.findByAuthId.mockResolvedValue(mockUser);
    mocks.cachePolicyPort.getDefaultTtlMs.mockReturnValue(900_000);
    mocks.cachePolicyPort.getMaxTtlMs.mockReturnValue(3_600_000);
    const useCase = new ResolveAuthCtxUseCase(
      mocks.authTokenPort,
      mocks.userLookupPort,
      mocks.authCtxCachePort,
      mocks.cachePolicyPort,
    );

    await useCase.execute(inputToken);

    expect(mocks.authCtxCachePort.setByToken).not.toHaveBeenCalled();
  });
});
