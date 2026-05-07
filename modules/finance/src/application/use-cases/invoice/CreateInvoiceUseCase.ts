import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { Invoice } from '../../../domain/entities/Invoice';
import { CreateInvoiceDTO, type InvoiceLineItemDTO } from '../../dtos';

export interface CreateInvoiceResult {
  id: string;
  invoiceNumber: string;
  type: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export class CreateInvoiceUseCase implements IUseCase<CreateInvoiceDTO, Result<CreateInvoiceResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateInvoiceDTO): Promise<Result<CreateInvoiceResult>> {
    // Get next invoice number
    const invoiceNumber = await this.invoiceRepo.getNextInvoiceNumber(dto.type);

    // Convert DTO line items to domain format
    const lineItems = dto.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    }));

    // Create invoice
    const invoiceResult = Invoice.create({
      type: dto.type,
      customerId: dto.customerId,
      customerName: dto.customerName,
      date: dto.date,
      dueDate: dto.dueDate,
      lineItems,
      notes: dto.notes,
    }, invoiceNumber);

    if (invoiceResult.isFailure()) {
      return Result.fail(invoiceResult.getError());
    }

    const invoice = invoiceResult.getValue();

    // Save to repository
    await this.invoiceRepo.save(invoice);

    // Pull and publish domain events
    const events = invoice.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      date: invoice.date,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      subTotal: invoice.subTotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    });
  }
}
