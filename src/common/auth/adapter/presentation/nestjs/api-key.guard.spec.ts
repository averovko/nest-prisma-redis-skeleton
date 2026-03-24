import { ExecutionContext } from '@nestjs/common';

import { AppError } from 'src/common/errors/app.error';
import { AuthAppError } from '../../../application';
import { ApiKeyGuard } from './api-key.guard';

const mockValidateApiKey: jest.Mocked<{
  execute: (key: string | undefined) => void;
}> = {
  execute: jest.fn(),
};

function buildGuard(): ApiKeyGuard {
  return new (ApiKeyGuard as any)(mockValidateApiKey);
}

function buildContext(
  apiKeyHeader: string | string[] | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'x-api-key': apiKeyHeader },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when api key is valid', async () => {
    mockValidateApiKey.execute.mockReturnValue(undefined);
    const guard = buildGuard();

    const result = await guard.canActivate(buildContext('valid-key'));

    expect(result).toBe(true);
    expect(mockValidateApiKey.execute).toHaveBeenCalledWith('valid-key');
  });

  it('passes undefined to validateApiKey when header is absent', async () => {
    mockValidateApiKey.execute.mockReturnValue(undefined);
    const guard = buildGuard();

    await guard.canActivate(buildContext(undefined));

    expect(mockValidateApiKey.execute).toHaveBeenCalledWith(undefined);
  });

  it('uses first element when x-api-key header is an array', async () => {
    mockValidateApiKey.execute.mockReturnValue(undefined);
    const guard = buildGuard();

    await guard.canActivate(buildContext(['key-from-array', 'second']));

    expect(mockValidateApiKey.execute).toHaveBeenCalledWith('key-from-array');
  });

  it('throws AppError when validateApiKey throws AuthAppError invalid-api-key', async () => {
    mockValidateApiKey.execute.mockImplementation(() => {
      throw new AuthAppError('invalid-api-key');
    });
    const guard = buildGuard();

    await expect(guard.canActivate(buildContext('wrong'))).rejects.toThrow(
      AppError,
    );
    await expect(guard.canActivate(buildContext('wrong'))).rejects.toThrow(
      expect.objectContaining({ code: 'auth.invalid-api-key' }),
    );
  });

  it('re-throws raw errors that are not AuthAppError', async () => {
    const raw = new Error('unexpected');
    mockValidateApiKey.execute.mockImplementation(() => {
      throw raw;
    });
    const guard = buildGuard();

    await expect(guard.canActivate(buildContext('key'))).rejects.toThrow(raw);
  });
});
