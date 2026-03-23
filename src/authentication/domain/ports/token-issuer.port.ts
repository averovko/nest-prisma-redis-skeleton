import { TokenPair } from '../entities/token-pair.value-object';

export const TOKEN_ISSUER_PORT = Symbol('TOKEN_ISSUER_PORT');

export interface TokenPayload {
  authId: string;
  email: string;
}

export interface TokenIssuerPort {
  issueTokenPair(payload: TokenPayload): TokenPair;
}
