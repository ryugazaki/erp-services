import { DomainEvent } from '@erp/shared/kernel';
import { IEventBus, IEventHandler } from './IEventBus';

export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler[]>();

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }

  subscribe(eventType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType);
  }
}
