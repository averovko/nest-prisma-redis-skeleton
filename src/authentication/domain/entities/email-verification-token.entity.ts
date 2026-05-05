export interface EmailVerificationToken {
  readonly id: string;
  readonly credentialsId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}
