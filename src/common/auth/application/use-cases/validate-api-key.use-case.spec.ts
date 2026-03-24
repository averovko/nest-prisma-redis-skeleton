import { AuthAppError } from '../errors/auth-app-error';
import type { ExpectedApiKeyPort } from '../ports/expected-api-key.port';
import { ValidateApiKeyUseCase } from './validate-api-key.use-case';

describe('ValidateApiKeyUseCase', () => {
  const mockExpectedApiKeyPort: jest.Mocked<ExpectedApiKeyPort> = {
    getExpectedApiKey: jest.fn(),
  };

  beforeEach(() => {
    mockExpectedApiKeyPort.getExpectedApiKey.mockReturnValue('secret-key');
  });

  it('does not throw when the api key matches', () => {
    const useCase = new ValidateApiKeyUseCase(mockExpectedApiKeyPort);

    expect(() => useCase.execute('secret-key')).not.toThrow();
  });

  it('throws invalid-api-key when the api key does not match', () => {
    const useCase = new ValidateApiKeyUseCase(mockExpectedApiKeyPort);

    expect(() => useCase.execute('wrong-key')).toThrow(AuthAppError);
    expect(() => useCase.execute('wrong-key')).toThrow(
      expect.objectContaining({ code: 'invalid-api-key' }),
    );
  });

  it('throws invalid-api-key when the api key is undefined', () => {
    const useCase = new ValidateApiKeyUseCase(mockExpectedApiKeyPort);

    expect(() => useCase.execute(undefined)).toThrow(AuthAppError);
    expect(() => useCase.execute(undefined)).toThrow(
      expect.objectContaining({ code: 'invalid-api-key' }),
    );
  });

  it('throws invalid-api-key when the api key is empty string', () => {
    const useCase = new ValidateApiKeyUseCase(mockExpectedApiKeyPort);

    expect(() => useCase.execute('')).toThrow(
      expect.objectContaining({ code: 'invalid-api-key' }),
    );
  });
});
