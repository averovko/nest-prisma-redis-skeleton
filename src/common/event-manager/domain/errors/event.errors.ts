export interface EventFieldError {
  readonly field: string;
  readonly messages: string[];
}

export class EventValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: EventFieldError[],
  ) {
    super(message);
    this.name = 'EventValidationError';
  }

  getValidationMessages(): string[] {
    return this.validationErrors.flatMap((error) => error.messages);
  }
}
