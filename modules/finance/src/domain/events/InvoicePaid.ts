import { DomainEvent } from '@erp/shared/kernel';

export class InvoicePaid extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly paymentId: string,
    public readonly amount: number,
  ) {
    super('finance.invoice.paid');
  }
}
