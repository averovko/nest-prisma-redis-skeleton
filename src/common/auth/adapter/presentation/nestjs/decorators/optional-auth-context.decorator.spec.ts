import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { AuthCtx } from '../../../../domain';
import { OptionalAuthContext } from './optional-auth-context.decorator';

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

describe('OptionalAuthContext decorator', () => {
  const factory = extractDecoratorFactory(OptionalAuthContext);

  it('returns the authCtx from the request when present', () => {
    const authCtx = AuthCtx.forService({ id: 'svc-1' });

    const result = factory(undefined, buildContext(authCtx));

    expect(result).toBe(authCtx);
  });

  it('returns undefined when authCtx is absent', () => {
    const result = factory(undefined, buildContext(undefined));

    expect(result).toBeUndefined();
  });
});
