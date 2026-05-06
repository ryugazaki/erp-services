import { IEventBus, IEventHandler } from '@erp/core/event-bus';
import { DomainEvent } from '@erp/shared/kernel';

export class MockEventBus implements IEventBus {
  private publishedEvents: DomainEvent[] = [];
  private handlers: Map<string, IEventHandler> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  subscribe(eventType: string, handler: IEventHandler): void {
    this.handlers.set(eventType, handler);
  }

  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType);
  }

  // Helper methods for testing
  getPublishedEvents(): DomainEvent[] {
    return this.publishedEvents;
  }

  clear(): void {
    this.publishedEvents = [];
  }

  eventCount(): number {
    return this.publishedEvents.length;
  }

  hasEvent(eventType: string): boolean {
    return this.publishedEvents.some((e) => e.constructor.name === eventType);
  }
}
