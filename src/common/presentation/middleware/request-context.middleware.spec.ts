import { Response, NextFunction } from 'express';
import {
  RequestContextMiddleware,
  RequestWithContext,
} from './request-context.middleware';
import { ParseUserAgentHelper } from 'src/common/helpers';

jest.mock('src/common/helpers', () => ({
  ParseUserAgentHelper: jest.fn(),
  IPToLocationHelper: jest.fn(),
}));

const mockedParseUserAgentHelper = ParseUserAgentHelper as jest.MockedFunction<
  typeof ParseUserAgentHelper
>;

function buildRequest(
  overrides: Partial<RequestWithContext> = {},
): RequestWithContext {
  return {
    headers: {},
    ip: undefined,
    ...overrides,
  } as unknown as RequestWithContext;
}

const noop: NextFunction = jest.fn();
const res = {} as Response;

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
    jest.clearAllMocks();
  });

  it('delegates user-agent parsing to ParseUserAgentHelper', () => {
    mockedParseUserAgentHelper.mockReturnValue({
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0',
      device: 'Desktop',
      client: 'Chrome 120.0',
      os: 'MacOS 14.2',
    });
    const req = buildRequest();

    middleware.use(req, res, noop);

    expect(mockedParseUserAgentHelper).toHaveBeenCalledWith(req);
  });

  it('sets requestContext with all parsed fields', () => {
    mockedParseUserAgentHelper.mockReturnValue({
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      device: 'Smartphone',
      client: 'Safari 17.0',
      os: 'iOS 17.1',
    });
    const req = buildRequest();

    middleware.use(req, res, noop);

    expect(req.requestContext).toEqual({
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
      device: 'Smartphone',
      client: 'Safari 17.0',
      os: 'iOS 17.1',
    });
  });

  it('calls next() after setting requestContext', () => {
    mockedParseUserAgentHelper.mockReturnValue({
      ipAddress: '',
      userAgent: '',
      device: '',
      client: '',
      os: '',
    });
    const req = buildRequest();

    middleware.use(req, res, noop);

    expect(noop).toHaveBeenCalledTimes(1);
  });

  it('propagates unknown device values from helper', () => {
    mockedParseUserAgentHelper.mockReturnValue({
      ipAddress: 'Unknown',
      userAgent: 'Unknown',
      device: 'Unknown device',
      client: 'Unknown application',
      os: 'Unknown OS',
    });
    const req = buildRequest();

    middleware.use(req, res, noop);

    expect(req.requestContext).toEqual({
      ipAddress: 'Unknown',
      userAgent: 'Unknown',
      device: 'Unknown device',
      client: 'Unknown application',
      os: 'Unknown OS',
    });
  });
});
