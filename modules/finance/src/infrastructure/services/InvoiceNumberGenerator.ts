import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { InvoiceNumberGenerator } from '../../application/ports/InvoiceNumberGenerator';

@injectable()
export class DatabaseInvoiceNumberGenerator implements InvoiceNumberGenerator {
  constructor(private readonly db: Kysely<any>) {}

  async generate(type: 'RECEIVABLE' | 'PAYABLE'): Promise<string> {
    // Format: INV-YYYYMMDD-#### for receivables, BL-YYYYMMDD-#### for payables
    const prefix = type === 'RECEIVABLE' ? 'INV' : 'BL';
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Find the last invoice number for today
    const likePattern = `${prefix}-${dateStr}%`;

    const result = await this.db
      .selectFrom('finance.invoices')
      .select('invoice_number')
      .where('invoice_number', 'like', likePattern)
      .orderBy('invoice_number', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!result || !result.invoice_number) {
      return `${prefix}-${dateStr}-0001`;
    }

    // Extract and increment the sequence number
    const parts = result.invoice_number.split('-');
    const lastSeq = parseInt(parts[2] || '0', 10);
    const nextSeq = (lastSeq + 1).toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${nextSeq}`;
  }
}
