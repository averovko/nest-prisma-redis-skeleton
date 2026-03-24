export const VALIDATE_API_KEY_USE_CASE = Symbol('ValidateApiKeyUseCase');

export interface IValidateApiKeyUseCase {
  execute(apiKey: string | undefined): void;
}
