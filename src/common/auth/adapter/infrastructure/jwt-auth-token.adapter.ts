import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthAppError,
  type TokenPayload,
  type AuthTokenPort,
} from '../../application';
import {
  JWT_AUTH_TOKEN_SETTINGS,
  type JwtAuthTokenSettings,
} from './jwt-auth-token.settings';

@Injectable()
export class JwtAuthTokenAdapter implements AuthTokenPort {
  private readonly logger = new Logger(JwtAuthTokenAdapter.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(JWT_AUTH_TOKEN_SETTINGS)
    private readonly settings: JwtAuthTokenSettings,
  ) {}

  async resolvePayload(token: string): Promise<TokenPayload> {
    if (!this.settings.shouldVerifyToken) {
      const decodedUnknown: unknown = this.jwtService.decode(token);
      if (!decodedUnknown || typeof decodedUnknown !== 'object') {
        this.logger.warn('auth: jwtAuthToken: failed to decode token');
        throw new AuthAppError('invalid-token');
      }
      return this.toTokenPayload(decodedUnknown as Record<string, unknown>);
    }
    try {
      const verified = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret: this.settings.jwtSecret,
      });
      return this.toTokenPayload(verified);
    } catch (err) {
      if (err instanceof AuthAppError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`auth: jwtAuthToken: invalid token: ${message}`);
      throw new AuthAppError('invalid-token', undefined, { cause: err });
    }
  }

  private toTokenPayload(payload: Record<string, unknown>): TokenPayload {
    const sub = payload.sub;
    if (typeof sub !== 'string') {
      this.logger.warn('auth: jwtAuthToken: token payload missing sub');
      throw new AuthAppError('invalid-token');
    }
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const phone = typeof payload.phone === 'string' ? payload.phone : undefined;
    const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
    return { sub, email, phone, exp };
  }
}
