import { DomainEvent } from '@erp/shared/kernel';
import { IEventBus, IEventHandler } from './IEventBus';
export declare class RabbitMQEventBus implements IEventBus {
    private readonly url;
    private connection;
    private channel;
    private handlers;
    private reconnectTimer;
    constructor(url: string);
    private connect;
    publish<T extends DomainEvent>(event: T): Promise<void>;
    subscribe(eventType: string, handler: IEventHandler): Promise<void>;
    unsubscribe(eventType: string): void;
    private scheduleReconnect;
    close(): Promise<void>;
}
