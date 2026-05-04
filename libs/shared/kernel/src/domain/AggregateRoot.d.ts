import { DomainEvent } from '../events/DomainEvent';
export declare abstract class AggregateRoot {
    private domainEvents;
    protected recordEvent(event: DomainEvent): void;
    pullEvents(): DomainEvent[];
    clearEvents(): void;
}
