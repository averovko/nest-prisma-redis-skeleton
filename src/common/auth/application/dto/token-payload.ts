export interface TokenPayload {
  sub: string;
  email?: string;
  phone?: string;
  exp?: number;
}
