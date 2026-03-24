import { AuthAppError } from '../errors/auth-app-error';
import type { ExpectedApiKeyPort } from '../ports/expected-api-key.port';
import type { IValidateApiKeyUseCase } from '../ports/validate-api-key.use-case.port';

export class ValidateApiKeyUseCase implements IValidateApiKeyUseCase {
  constructor(private readonly expectedApiKeyPort: ExpectedApiKeyPort) {}

  execute(apiKey: string | undefined): void {
    const expected = this.expectedApiKeyPort.getExpectedApiKey();
    if (!apiKey || apiKey !== expected) {
      throw new AuthAppError('invalid-api-key');
    }
  }
}
