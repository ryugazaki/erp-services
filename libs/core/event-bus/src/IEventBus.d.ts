import { DomainEvent } from '@erp/shared/kernel';
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
    handle(event: T): Promise<void>;
}
export interface IEventBus {
    publish<T extends DomainEvent>(event: T): Promise<void>;
    subscribe(eventType: string, handler: IEventHandler): void;
    unsubscribe(eventType: string): void;
}
