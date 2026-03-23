export const PASSWORD_HASHER_PORT = Symbol('PASSWORD_HASHER_PORT');

export interface PasswordHasherPort {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
