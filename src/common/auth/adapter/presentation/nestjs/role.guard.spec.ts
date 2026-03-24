import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppError } from 'src/common/errors/app.error';
import { AuthCtx, Role, type User } from '../../../domain';
import { ROLES_KEY } from './decorators/require-any-roles.decorator';
import { RolesGuard } from './role.guard';

const mockUser: User = {
  id: 'usr-1',
  authId: 'auth-1',
  email: 'a@b.com',
  phone: null,
  firstName: 'Alice',
  lastName: null,
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildContextWithReflector(
  reflector: Reflector,
  authCtx: AuthCtx | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ authCtx }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('returns true when no ROLES_KEY metadata is set (public endpoint)', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContextWithReflector(reflector, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws AppError auth.invalid-token when roles required but authCtx is absent', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContextWithReflector(reflector, undefined);

    expect(() => guard.canActivate(context)).toThrow(AppError);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({ code: 'auth.invalid-token' }),
    );
  });

  it('returns true when user has the required role', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'a-1' }, mockUser);
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContextWithReflector(reflector, authCtx);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws AppError auth.no-privilege when user lacks the required role', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'a-1' }, mockUser);
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContextWithReflector(reflector, authCtx);

    expect(() => guard.canActivate(context)).toThrow(AppError);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({ code: 'auth.no-privilege' }),
    );
  });

  it('throws AppError auth.require-user when roles required but authCtx has no user', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'a-1' }, undefined);
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = buildContextWithReflector(reflector, authCtx);

    expect(() => guard.canActivate(context)).toThrow(AppError);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({ code: 'auth.require-user' }),
    );
  });

  it('reads roles from both handler and class metadata via reflector', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const handler = jest.fn();
    const cls = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          authCtx: AuthCtx.forPerson({ authId: 'a-1' }, mockUser),
        }),
      }),
      getHandler: () => handler,
      getClass: () => cls,
    } as unknown as ExecutionContext;

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      handler,
      cls,
    ]);
  });
});
