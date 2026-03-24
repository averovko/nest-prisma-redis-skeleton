import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { AppError } from 'src/common/errors/app.error';
import { AuthCtx, Role, type User } from '../../../../domain';
import { AuthContextUser } from './auth-context-user.decorator';

type ParamFactory = (data: unknown, ctx: ExecutionContext) => unknown;

function extractDecoratorFactory(
  decorator: (...args: unknown[]) => ParameterDecorator,
): ParamFactory {
  class TestHost {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test(@decorator() _val: unknown): void {}
  }
  const argsMetadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestHost,
    'test',
  ) as Record<string, { factory: ParamFactory }>;
  return argsMetadata[Object.keys(argsMetadata)[0]].factory;
}

function buildContext(authCtx: AuthCtx | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ authCtx }),
    }),
  } as unknown as ExecutionContext;
}

const mockUser: User = {
  id: 'usr-1',
  authId: 'auth-1',
  email: 'a@b.com',
  phone: null,
  firstName: 'Alice',
  lastName: 'Smith',
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthContextUser decorator', () => {
  const factory = extractDecoratorFactory(AuthContextUser);

  it('throws AppError auth.invalid-token when authCtx is absent', () => {
    expect(() => factory(undefined, buildContext(undefined))).toThrow(AppError);
    expect(() => factory(undefined, buildContext(undefined))).toThrow(
      expect.objectContaining({ code: 'auth.invalid-token' }),
    );
  });

  it('returns the full User when no data param is specified', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'auth-1' }, mockUser);

    const result = factory(undefined, buildContext(authCtx));

    expect(result).toEqual(mockUser);
  });

  it('returns a specific user field when data param is a valid key', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'auth-1' }, mockUser);

    const result = factory('email', buildContext(authCtx));

    expect(result).toBe('a@b.com');
  });

  it('returns another user field when data param is id', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'auth-1' }, mockUser);

    const result = factory('id', buildContext(authCtx));

    expect(result).toBe('usr-1');
  });

  it('throws AppError auth.require-user when authCtx has no user', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'auth-1' }, undefined);

    expect(() => factory(undefined, buildContext(authCtx))).toThrow(AppError);
    expect(() => factory(undefined, buildContext(authCtx))).toThrow(
      expect.objectContaining({ code: 'auth.require-user' }),
    );
  });
});
