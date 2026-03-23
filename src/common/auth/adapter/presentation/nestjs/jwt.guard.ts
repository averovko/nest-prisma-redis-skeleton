import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../../../core/application/services/auth.service';
import { JwtAuthCtxRepo } from '../../infrastructure/repositories/jwt-auth-ctx.repo';

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly authService: AuthService;

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    authCtxRepo: JwtAuthCtxRepo,
    configService: ConfigService,
  ) {
    this.authService = new AuthService(cacheManager, authCtxRepo, {
      cacheDefaultTtlMs: configService.get<number>('auth.cacheDefaultTtlMs', 15 * 60 * 1000),
      cacheMaxTtlMs: configService.get<number>('auth.cacheMaxTtlMs', 60 * 60 * 1000),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authService.canActivate(request);
  }
}
