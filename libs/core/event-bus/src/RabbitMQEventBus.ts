import * as amqp from 'amqplib';
import { DomainEvent } from '@erp/shared/kernel';
import { IEventBus, IEventHandler } from './IEventBus';
import { Logger } from '@erp/shared/utils';

const EXCHANGE_NAME = 'erp.events';

export class RabbitMQEventBus implements IEventBus {
  private connection: any = null;
  private channel: any = null;
  private handlers = new Map<string, IEventHandler[]>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly url: string) {}

  private async connect(): Promise<void> {
    if (this.channel) return;

    try {
      const conn = await amqp.connect(this.url);
      this.connection = conn;
      this.channel = await conn.createChannel();
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

      conn.on('close', () => {
        this.channel = null;
        this.connection = null;
        this.scheduleReconnect();
      });

      conn.on('error', (err: Error) => {
        Logger.error('RabbitMQ connection error', { error: err.message });
      });

      Logger.info('RabbitMQ connected');
    } catch (error) {
      Logger.error('RabbitMQ connection failed', { error: (error as Error).message });
      this.scheduleReconnect();
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.connect();

    if (!this.channel) {
      Logger.error('Cannot publish event: no RabbitMQ channel', { eventType: event.eventType });
      return;
    }

    const payload = JSON.stringify(event);
    this.channel.publish(EXCHANGE_NAME, event.eventType, Buffer.from(payload), {
      persistent: true,
      contentType: 'application/json',
    });
  }

  async subscribe(eventType: string, handler: IEventHandler): Promise<void> {
    await this.connect();

    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);

    if (!this.channel) return;

    const queueName = `erp.${eventType}`;
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, EXCHANGE_NAME, eventType);

    this.channel.consume(queueName, async (msg: any) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        const handlers = this.handlers.get(eventType) ?? [];
        for (const h of handlers) {
          await h.handle(event);
        }
        this.channel!.ack(msg);
      } catch (error) {
        Logger.error('Event handler error', { eventType, error: (error as Error).message });
        this.channel!.nack(msg, false, false);
      }
    });
  }

  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  async close(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
  }
}
