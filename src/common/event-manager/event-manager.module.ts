import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusAdapter } from './adapter/infrastructure/event-bus.adapter';
import { EventValidator } from './adapter/infrastructure/event-validator';
import { EventRegistryService } from './adapter/infrastructure/event-registry.service';
import { EVENT_BUS_TOKEN } from './application/ports/event-bus.port';
import { EVENT_VALIDATOR_TOKEN } from './application/ports/event-validator.port';
import { EVENT_REGISTRY_TOKEN } from './application/ports/event-registry.port';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    {
      provide: EVENT_REGISTRY_TOKEN,
      useClass: EventRegistryService,
    },
    {
      provide: EVENT_VALIDATOR_TOKEN,
      useClass: EventValidator,
    },
    {
      provide: EVENT_BUS_TOKEN,
      useClass: EventBusAdapter,
    },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventManagerModule {}
