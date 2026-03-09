import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppConfigModule } from './configuration/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventManagerModule } from './event-manager/event-manager.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    EventManagerModule,
    PrismaModule,
  ],
})
export class CommonModule {}
