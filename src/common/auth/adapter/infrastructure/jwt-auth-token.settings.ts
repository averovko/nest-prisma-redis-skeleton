export const JWT_AUTH_TOKEN_SETTINGS = Symbol('JwtAuthTokenSettings');

export interface JwtAuthTokenSettings {
  shouldVerifyToken: boolean;
  jwtSecret: string;
}
