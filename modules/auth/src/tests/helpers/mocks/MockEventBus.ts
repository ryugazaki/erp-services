import { DomainEvent } from '@erp/shared/kernel';

export class MockEventBus {
  public published: DomainEvent[] = [];

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    this.published.push(event);
  }

  subscribe() {}
  unsubscribe() {}

  clear(): void {
    this.published = [];
  }
}
