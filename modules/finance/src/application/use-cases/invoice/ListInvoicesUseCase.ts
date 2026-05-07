import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IInvoiceRepository, type InvoiceFilter, type PaginationInput } from '../../../domain/repositories/IInvoiceRepository';
import { ListInvoicesDTO } from '../../dtos';

export interface InvoiceLineItemResult {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  type: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  createdAt: Date;
}

export interface ListInvoicesResult {
  items: InvoiceListItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ListInvoicesUseCase implements IUseCase<ListInvoicesDTO, Result<ListInvoicesResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
  ) {}

  async execute(dto: ListInvoicesDTO): Promise<Result<ListInvoicesResult>> {
    const filter: InvoiceFilter = {
      type: dto.type,
      status: dto.status,
      customerId: dto.customerId,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
    };

    const pagination: PaginationInput = {
      page: dto.page,
      limit: dto.limit,
    };

    const result = await this.invoiceRepo.findAll(filter, pagination);

    const items: InvoiceListItem[] = result.items.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      date: invoice.date,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
      status: invoice.status,
      createdAt: invoice.createdAt,
    }));

    return Result.ok({
      items,
      meta: result.meta,
    });
  }
}
