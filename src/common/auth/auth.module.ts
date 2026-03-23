import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from 'src/common/configuration/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './adapter/presentation/nestjs/auth.guard';
import { RolesGuard } from './adapter/presentation/nestjs/role.guard';
import { JWTGuard } from './adapter/presentation/nestjs/jwt.guard';
import { JwtAuthCtxRepo } from './adapter/infrastructure/repositories/jwt-auth-ctx.repo';
import { AuthService } from './core/application/services/auth.service';
import { ApiKeyGuard } from './api-key.guard';

@Global()
@Module({
  imports: [AppConfigModule, JwtModule],
  providers: [
    AuthGuard,
    ApiKeyGuard,
    ConfigService,
    JwtService,
    AuthService,
    RolesGuard,
    JWTGuard,
    JwtAuthCtxRepo,
  ],
  exports: [AuthGuard, ApiKeyGuard, RolesGuard, JWTGuard],
})
export class AuthModule {}
