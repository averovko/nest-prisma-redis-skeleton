import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from 'src/common/configuration/config.module';

import { CacheManagerAuthCtxCacheAdapter } from './adapter/infrastructure/cache-manager-auth-ctx-cache.adapter';
import { ConfigCachePolicyAdapter } from './adapter/infrastructure/config-cache-policy.adapter';
import { ConfigExpectedApiKeyAdapter } from './adapter/infrastructure/config-expected-api-key.adapter';
import { JwtAuthTokenAdapter } from './adapter/infrastructure/jwt-auth-token.adapter';
import {
  JWT_AUTH_TOKEN_SETTINGS,
  type JwtAuthTokenSettings,
} from './adapter/infrastructure/jwt-auth-token.settings';
import { PrismaUserLookupAdapter } from './adapter/infrastructure/prisma-user-lookup.adapter';
import { ApiKeyGuard } from './adapter/presentation/nestjs/api-key.guard';
import { JWTGuard } from './adapter/presentation/nestjs/jwt.guard';
import { OptionalAuthGuard } from './adapter/presentation/nestjs/optional-auth.guard';
import { RolesGuard } from './adapter/presentation/nestjs/role.guard';
import { ResolveAuthCtxUseCase } from './application/use-cases/resolve-auth-ctx.use-case';
import { ValidateApiKeyUseCase } from './application/use-cases/validate-api-key.use-case';
import {
  RESOLVE_AUTH_CTX_USE_CASE,
  type IResolveAuthCtxUseCase,
  VALIDATE_API_KEY_USE_CASE,
  type IValidateApiKeyUseCase,
  CACHE_POLICY_PORT,
  type CachePolicyPort,
  AUTH_CTX_CACHE_PORT,
  type AuthCtxCachePort,
  AUTH_TOKEN_PORT,
  type AuthTokenPort,
  EXPECTED_API_KEY_PORT,
  type ExpectedApiKeyPort,
  USER_LOOKUP_PORT,
  type UserLookupPort,
} from './application';

@Global()
@Module({
  imports: [AppConfigModule, JwtModule],
  providers: [
    { provide: AUTH_TOKEN_PORT, useClass: JwtAuthTokenAdapter },
    { provide: EXPECTED_API_KEY_PORT, useClass: ConfigExpectedApiKeyAdapter },
    { provide: USER_LOOKUP_PORT, useClass: PrismaUserLookupAdapter },
    { provide: AUTH_CTX_CACHE_PORT, useClass: CacheManagerAuthCtxCacheAdapter },
    { provide: CACHE_POLICY_PORT, useClass: ConfigCachePolicyAdapter },
    {
      provide: JWT_AUTH_TOKEN_SETTINGS,
      useFactory: (config: ConfigService): JwtAuthTokenSettings => ({
        shouldVerifyToken: config.get<boolean>(
          'security.shouldVerifyToken',
          false,
        ),
        jwtSecret: config.get<string>('security.jwtSecret', ''),
      }),
      inject: [ConfigService],
    },
    {
      provide: RESOLVE_AUTH_CTX_USE_CASE,
      useFactory: (
        authTokenPort: AuthTokenPort,
        userLookupPort: UserLookupPort,
        authCtxCachePort: AuthCtxCachePort,
        cachePolicyPort: CachePolicyPort,
      ): IResolveAuthCtxUseCase =>
        new ResolveAuthCtxUseCase(
          authTokenPort,
          userLookupPort,
          authCtxCachePort,
          cachePolicyPort,
        ),
      inject: [
        AUTH_TOKEN_PORT,
        USER_LOOKUP_PORT,
        AUTH_CTX_CACHE_PORT,
        CACHE_POLICY_PORT,
      ],
    },
    {
      provide: VALIDATE_API_KEY_USE_CASE,
      useFactory: (
        expectedApiKeyPort: ExpectedApiKeyPort,
      ): IValidateApiKeyUseCase =>
        new ValidateApiKeyUseCase(expectedApiKeyPort),
      inject: [EXPECTED_API_KEY_PORT],
    },
    JWTGuard,
    OptionalAuthGuard,
    RolesGuard,
    ApiKeyGuard,
  ],
  exports: [
    RESOLVE_AUTH_CTX_USE_CASE,
    VALIDATE_API_KEY_USE_CASE,
    JWTGuard,
    OptionalAuthGuard,
    RolesGuard,
    ApiKeyGuard,
  ],
})
export class AuthModule {}
