interface DomainEvent {
  eventType: string;
  [key: string]: any;
}

type EventHandler = (event: DomainEvent) => Promise<void>;

export class MockEventBus {
  public published: DomainEvent[] = [];
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    this.published.push(event);
    const handlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType);
  }

  clear(): void {
    this.published = [];
    this.handlers.clear();
  }
}
