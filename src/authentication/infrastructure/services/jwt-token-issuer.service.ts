import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  TokenIssuerPort,
  TokenPayload,
} from '../../domain/ports/token-issuer.port';
import { TokenPair } from '../../domain/entities/token-pair.value-object';

@Injectable()
export class JwtTokenIssuer implements TokenIssuerPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  issueTokenPair(payload: TokenPayload): TokenPair {
    const secret = this.configService.get<string>('security.jwtSecret');
    const accessTokenExpiry = this.configService.get(
      'security.accessTokenExpiry',
    );
    const refreshTokenExpiry = this.configService.get(
      'security.refreshTokenExpiry',
    );

    const accessToken = this.jwtService.sign(
      { sub: payload.authId, email: payload.email },
      { secret, expiresIn: accessTokenExpiry },
    );

    const refreshToken = this.jwtService.sign(
      { sub: payload.authId },
      { secret, expiresIn: refreshTokenExpiry },
    );

    return { accessToken, refreshToken };
  }
}
