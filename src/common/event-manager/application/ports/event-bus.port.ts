import { BaseEvent } from '../../domain/events/base.event';

export const EVENT_BUS_TOKEN = Symbol('EventBusPort');

export interface EventBusPort {
  publish<T extends object>(event: BaseEvent<T>): Promise<void>;
}
