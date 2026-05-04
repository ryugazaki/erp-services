import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly eventType: string,
  ) {
    this.eventId = randomUUID();
    this.timestamp = new Date();
  }
}
