import { DomainEvent } from '@erp/shared/kernel';

export class InvoiceCancelled extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly reason: string | null,
  ) {
    super('finance.invoice.cancelled');
  }
}
