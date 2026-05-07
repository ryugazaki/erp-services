import { DomainEvent } from '@erp/shared/kernel';

export class InvoiceCreated extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly type: string,
    public readonly totalAmount: number,
  ) {
    super('finance.invoice.created');
  }
}
