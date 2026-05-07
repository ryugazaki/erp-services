import { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  getTotalPaidForInvoice(invoiceId: string): Promise<number>;
}
