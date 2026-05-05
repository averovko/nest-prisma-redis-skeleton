export interface SendWelcomeEmailInput {
  readonly email: string;
  readonly firstName: string;
  readonly verificationToken: string;
}

export interface SendPasswordResetEmailInput {
  readonly email: string;
  readonly rawToken: string;
}

export interface SendPasswordChangedEmailInput {
  readonly email: string;
  readonly ipAddress?: string;
  readonly changedAt?: string;
}

export interface SendPasswordResetCompletedEmailInput {
  readonly email: string;
  readonly ipAddress?: string;
  readonly completedAt?: string;
}
