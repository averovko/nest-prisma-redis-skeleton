import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisClientOptions } from 'redis';
import KeyvRedis from '@keyv/redis';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';

import { AppConfigModule } from './configuration/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventManagerModule } from './event-manager/event-manager.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule.registerAsync<RedisClientOptions>({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (service: ConfigService) => {
        return {
          stores: [new KeyvRedis(service.get<string>('redis.url'))],
        };
      },
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          url: configService.get<string>('redis.url'),
        } as RedisModuleOptions;
      },
    }),
    EventEmitterModule.forRoot(),
    EventManagerModule,
    AuthModule,
    PrismaModule,
    ConfigModule,
  ],
})
export class CommonModule {}
