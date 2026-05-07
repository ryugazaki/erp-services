import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IInvoiceRepository, type InvoiceFilter, type PaginationInput } from '../../domain/repositories/IInvoiceRepository';
import { Invoice, type InvoiceLineItem } from '../../domain/entities/Invoice';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

interface DatabaseInvoice {
  id: string;
  invoice_number: string;
  type: string;
  customer_id: string;
  customer_name: string;
  date: Date;
  due_date: Date;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseInvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  created_at: Date;
}

@injectable()
export class KyselyInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Invoice | null> {
    const row = await this.db
      .selectFrom('finance.invoices')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const lineItems = await this.getLineItems(id);

    return this.toEntity(row as DatabaseInvoice, lineItems);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const row = await this.db
      .selectFrom('finance.invoices')
      .selectAll()
      .where('invoice_number', '=', invoiceNumber)
      .executeTakeFirst();

    if (!row) return null;

    const lineItems = await this.getLineItems(row.id as string);

    return this.toEntity(row as DatabaseInvoice, lineItems);
  }

  async findAll(filter: InvoiceFilter, pagination: PaginationInput): Promise<PaginatedResult<Invoice>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('finance.invoices')
      .selectAll();

    if (filter.type) {
      query = query.where('type', '=', filter.type);
    }

    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }

    if (filter.customerId) {
      query = query.where('customer_id', '=', filter.customerId);
    }

    if (filter.dateFrom) {
      query = query.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      query = query.where('date', '<=', filter.dateTo);
    }

    // Count query
    let countQuery = this.db
      .selectFrom('finance.invoices')
      .select(this.db.fn.countAll().as('count'));

    if (filter.type) {
      countQuery = countQuery.where('type', '=', filter.type);
    }

    if (filter.status) {
      countQuery = countQuery.where('status', '=', filter.status);
    }

    if (filter.customerId) {
      countQuery = countQuery.where('customer_id', '=', filter.customerId);
    }

    if (filter.dateFrom) {
      countQuery = countQuery.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      countQuery = countQuery.where('date', '<=', filter.dateTo);
    }

    const [{ count }] = await countQuery.execute();
    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('date', 'desc')
      .orderBy('invoice_number', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .execute();

    const items: Invoice[] = [];
    for (const row of rows) {
      const lineItems = await this.getLineItems(row.id as string);
      items.push(this.toEntity(row as DatabaseInvoice, lineItems));
    }

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items,
      meta,
    };
  }

  async save(invoice: Invoice): Promise<void> {
    await this.db
      .insertInto('finance.invoices')
      .values({
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        type: invoice.type,
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        date: invoice.date,
        due_date: invoice.dueDate,
        sub_total: invoice.subTotal,
        tax_amount: invoice.taxAmount,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount,
        status: invoice.status,
        notes: invoice.notes,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt,
      })
      .execute();

    // Insert line items
    if (invoice.lineItems.length > 0) {
      const lineItemValues = invoice.lineItems.map(item => ({
        id: item.id,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        total: item.total,
      }));

      await this.db
        .insertInto('finance.invoice_line_items')
        .values(lineItemValues)
        .execute();
    }
  }

  async update(invoice: Invoice): Promise<void> {
    await this.db
      .updateTable('finance.invoices')
      .set({
        date: invoice.date,
        due_date: invoice.dueDate,
        sub_total: invoice.subTotal,
        tax_amount: invoice.taxAmount,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount,
        status: invoice.status,
        notes: invoice.notes,
        updated_at: invoice.updatedAt,
      })
      .where('id', '=', invoice.id)
      .execute();
  }

  async getOutstandingInvoices(asOfDate: Date): Promise<Invoice[]> {
    const rows = await this.db
      .selectFrom('finance.invoices')
      .selectAll()
      .where('status', 'in', ['PENDING', 'OVERDUE'])
      .where('due_date', '<=', asOfDate)
      .orderBy('due_date', 'asc')
      .execute();

    const invoices: Invoice[] = [];
    for (const row of rows) {
      const lineItems = await this.getLineItems(row.id as string);
      invoices.push(this.toEntity(row as DatabaseInvoice, lineItems));
    }

    return invoices;
  }

  async getNextInvoiceNumber(type: string): Promise<string> {
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

  private async getLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    const rows = await this.db
      .selectFrom('finance.invoice_line_items')
      .selectAll()
      .where('invoice_id', '=', invoiceId)
      .orderBy('id', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      taxRate: Number(row.tax_rate),
      total: Number(row.total),
    }));
  }

  private toEntity(row: DatabaseInvoice, lineItems: InvoiceLineItem[]): Invoice {
    return Invoice.reconstitute({
      id: row.id,
      invoiceNumber: row.invoice_number,
      type: row.type,
      customerId: row.customer_id,
      customerName: row.customer_name,
      date: row.date,
      dueDate: row.due_date,
      lineItems,
      subTotal: Number(row.sub_total),
      taxAmount: Number(row.tax_amount),
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
