import { Inject } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from '../../../application/ports/event-bus.port';

export const InjectEventBus = () => Inject(EVENT_BUS_TOKEN);
