import { DomainEvent } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';

export class MockEventBus implements IEventBus {
  publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }

  subscribe(_eventType: string, _handler: any): void {}
  unsubscribe(_eventType: string): void {}

  async close(): Promise<void> {
    this.publishedEvents = [];
  }

  clear(): void {
    this.publishedEvents = [];
  }
}
