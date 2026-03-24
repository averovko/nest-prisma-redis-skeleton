import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { AppError } from 'src/common/errors/app.error';
import { AuthCtx } from '../../../../domain';
import { AuthContext } from './auth-context.decorator';

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

describe('AuthContext decorator', () => {
  const factory = extractDecoratorFactory(AuthContext);

  it('returns the authCtx from the request when present', () => {
    const authCtx = AuthCtx.forService({ id: 'svc-1' });

    const result = factory(undefined, buildContext(authCtx));

    expect(result).toBe(authCtx);
  });

  it('throws AppError auth.invalid-token when authCtx is absent', () => {
    expect(() => factory(undefined, buildContext(undefined))).toThrow(AppError);
    expect(() => factory(undefined, buildContext(undefined))).toThrow(
      expect.objectContaining({ code: 'auth.invalid-token' }),
    );
  });
});
