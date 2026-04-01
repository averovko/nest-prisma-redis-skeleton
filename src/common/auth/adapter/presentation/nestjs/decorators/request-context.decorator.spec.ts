import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ReqContext } from './request-context.decorator';
import { type RequestContext } from '../../../../domain';

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

function buildContext(requestContext?: RequestContext): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ requestContext }),
    }),
  } as unknown as ExecutionContext;
}

describe('ReqContext decorator', () => {
  const factory = extractDecoratorFactory(ReqContext);

  it('returns requestContext when present on the request', () => {
    const ctx: RequestContext = { ipAddress: '10.0.0.1', userAgent: 'UA', device: 'Desktop', client: 'Chrome', os: 'Linux' };

    const result = factory(undefined, buildContext(ctx));

    expect(result).toEqual(ctx);
  });

  it('returns undefined when requestContext is absent', () => {
    const result = factory(undefined, buildContext(undefined));

    expect(result).toBeUndefined();
  });

  it('returns empty object when requestContext is an empty object', () => {
    const result = factory(undefined, buildContext({}));

    expect(result).toEqual({});
  });
});
