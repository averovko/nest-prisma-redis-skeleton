import { TokenPayload } from '../dto/token-payload';

export const AUTH_TOKEN_PORT = Symbol('AuthTokenPort');

export interface AuthTokenPort {
  resolvePayload(token: string): Promise<TokenPayload>;
}
