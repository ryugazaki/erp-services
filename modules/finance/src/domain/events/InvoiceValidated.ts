import { DomainEvent } from '@erp/shared/kernel';

export class InvoiceValidated extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly totalAmount: number,
  ) {
    super('finance.invoice.validated');
  }
}
