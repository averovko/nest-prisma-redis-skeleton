export const EXPECTED_API_KEY_PORT = Symbol('ExpectedApiKeyPort');

export interface ExpectedApiKeyPort {
  getExpectedApiKey(): string;
}
