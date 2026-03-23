export interface Credentials {
  readonly id: string;
  readonly authId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly isVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
