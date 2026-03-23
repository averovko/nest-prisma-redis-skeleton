export interface ConfirmPasswordResetInput {
  readonly token: string;
  readonly newPassword: string;
}
