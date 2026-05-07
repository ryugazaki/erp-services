import { Invoice } from '../entities/Invoice';
import { PaginatedResult } from '@erp/shared/kernel';

export type InvoiceFilter = {
  type?: string;
  status?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type PaginationInput = {
  page: number;
  limit: number;
};

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  findAll(filter: InvoiceFilter, pagination: PaginationInput): Promise<PaginatedResult<Invoice>>;
  save(invoice: Invoice): Promise<void>;
  update(invoice: Invoice): Promise<void>;
  getOutstandingInvoices(asOfDate: Date): Promise<Invoice[]>;
  getNextInvoiceNumber(type: string): Promise<string>;
}
