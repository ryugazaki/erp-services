import { Invoice } from '../../domain/entities/Invoice';
import type { IInvoiceRepository, InvoiceFilter, PaginationInput } from '../../domain/repositories/IInvoiceRepository';
import { PaginatedResult } from '@erp/shared/kernel';

export class MockInvoiceRepository implements IInvoiceRepository {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceCounter: Record<string, number> = { RECEIVABLE: 0, PAYABLE: 0 };

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) ?? null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    for (const invoice of this.invoices.values()) {
      if (invoice.invoiceNumber === invoiceNumber) return invoice;
    }
    return null;
  }

  async findAll(filter: InvoiceFilter, pagination: PaginationInput): Promise<PaginatedResult<Invoice>> {
    let items = Array.from(this.invoices.values());

    if (filter.type) {
      items = items.filter((i) => i.type === filter.type);
    }

    if (filter.status) {
      items = items.filter((i) => i.status === filter.status);
    }

    if (filter.customerId) {
      items = items.filter((i) => i.customerId === filter.customerId);
    }

    if (filter.dateFrom) {
      items = items.filter((i) => i.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      items = items.filter((i) => i.date <= filter.dateTo!);
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paged = items.slice(start, start + pagination.limit);

    return {
      items: paged,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  async save(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async update(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async getOutstandingInvoices(_asOfDate: Date): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (i) => i.status === 'PENDING' || i.status === 'OVERDUE',
    );
  }

  async getNextInvoiceNumber(type: 'RECEIVABLE' | 'PAYABLE'): Promise<string> {
    const prefix = type === 'RECEIVABLE' ? 'INV' : 'BL';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    this.invoiceCounter[type] = (this.invoiceCounter[type] || 0) + 1;
    const sequence = String(this.invoiceCounter[type]).padStart(4, '0');

    return `${prefix}-${dateStr}-${sequence}`;
  }

  clear(): void {
    this.invoices.clear();
    this.invoiceCounter = { RECEIVABLE: 0, PAYABLE: 0 };
  }
}
