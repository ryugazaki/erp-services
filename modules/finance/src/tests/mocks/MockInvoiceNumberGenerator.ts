import type { IInvoiceNumberGenerator } from '../../application/ports/InvoiceNumberGenerator';

export class MockInvoiceNumberGenerator implements IInvoiceNumberGenerator {
  private counters: Record<string, number> = { RECEIVABLE: 0, PAYABLE: 0 };
  private dateStr = '20240115';

  async generate(type: 'RECEIVABLE' | 'PAYABLE'): Promise<string> {
    const prefix = type === 'RECEIVABLE' ? 'INV' : 'BL';
    this.counters[type] = (this.counters[type] || 0) + 1;
    const sequence = String(this.counters[type]).padStart(4, '0');
    return `${prefix}-${this.dateStr}-${sequence}`;
  }

  setDate(date: Date): void {
    this.dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }

  reset(): void {
    this.counters = { RECEIVABLE: 0, PAYABLE: 0 };
  }
}
