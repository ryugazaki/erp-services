export declare abstract class DomainEvent {
    readonly eventType: string;
    readonly eventId: string;
    readonly timestamp: Date;
    constructor(eventType: string);
}
