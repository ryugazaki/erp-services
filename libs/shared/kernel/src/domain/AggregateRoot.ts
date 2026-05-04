import { DomainEvent } from '../events/DomainEvent';

export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected recordEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  clearEvents(): void {
    this.domainEvents = [];
  }
}
