import { DomainEvent } from '@erp/shared/kernel';

export class PaymentRecorded extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly invoiceId: string,
    public readonly amount: number,
    public readonly paymentDate: Date,
  ) {
    super('finance.payment.recorded');
  }
}
