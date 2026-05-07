import type { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';

export interface PaymentState {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export class MockPaymentRepository implements IPaymentRepository {
  private payments: Map<string, PaymentState> = new Map();

  async findById(id: string): Promise<PaymentState | null> {
    return this.payments.get(id) ?? null;
  }

  async findByInvoiceId(invoiceId: string): Promise<PaymentState[]> {
    return Array.from(this.payments.values()).filter((p) => p.invoiceId === invoiceId);
  }

  async save(payment: PaymentState): Promise<void> {
    this.payments.set(payment.id, payment);
  }

  async getTotalPaidForInvoice(invoiceId: string): Promise<number> {
    const payments = Array.from(this.payments.values()).filter((p) => p.invoiceId === invoiceId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  clear(): void {
    this.payments.clear();
  }
}
