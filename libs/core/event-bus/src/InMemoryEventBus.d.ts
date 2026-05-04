import { DomainEvent } from '@erp/shared/kernel';
import { IEventBus, IEventHandler } from './IEventBus';
export declare class InMemoryEventBus implements IEventBus {
    private handlers;
    publish<T extends DomainEvent>(event: T): Promise<void>;
    subscribe(eventType: string, handler: IEventHandler): void;
    unsubscribe(eventType: string): void;
}
