export interface RefreshToken {
  readonly id: string;
  readonly credentialsId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}
