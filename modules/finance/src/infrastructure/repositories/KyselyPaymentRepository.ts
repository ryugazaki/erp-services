import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';

interface DatabasePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: Date;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: Date;
}

@injectable()
export class KyselyPaymentRepository implements IPaymentRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.db
      .selectFrom('finance.payments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row as DatabasePayment) : null;
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const rows = await this.db
      .selectFrom('finance.payments')
      .selectAll()
      .where('invoice_id', '=', invoiceId)
      .orderBy('payment_date', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((row) => this.toEntity(row as DatabasePayment));
  }

  async save(payment: Payment): Promise<void> {
    await this.db
      .insertInto('finance.payments')
      .values({
        id: payment.id,
        invoice_id: payment.invoiceId,
        amount: payment.amount,
        payment_date: payment.paymentDate,
        payment_method: payment.paymentMethod,
        reference: payment.reference,
        notes: payment.notes,
        created_at: payment.createdAt,
      })
      .execute();
  }

  async getTotalPaidForInvoice(invoiceId: string): Promise<number> {
    const result = await this.db
      .selectFrom('finance.payments')
      .select(this.db.fn<string>('sum', ['amount']).as('total'))
      .where('invoice_id', '=', invoiceId)
      .executeTakeFirst();

    return result && result.total ? Number(result.total) : 0;
  }

  private toEntity(row: DatabasePayment): Payment {
    return Payment.reconstitute({
      id: row.id,
      invoiceId: row.invoice_id,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      reference: row.reference,
      notes: row.notes,
      createdAt: row.created_at,
    });
  }
}
