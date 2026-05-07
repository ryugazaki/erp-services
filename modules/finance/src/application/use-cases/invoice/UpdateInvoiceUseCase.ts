import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { UpdateInvoiceDTO, type InvoiceLineItemDTO } from '../../dtos';

export interface UpdateInvoiceInput extends UpdateInvoiceDTO {
  id: string;
}

export interface InvoiceResult {
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
  status: string;
  notes: string | null;
  updatedAt: Date;
}

export class UpdateInvoiceUseCase implements IUseCase<UpdateInvoiceInput, Result<InvoiceResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateInvoiceInput): Promise<Result<InvoiceResult>> {
    const invoice = await this.invoiceRepo.findById(input.id);

    if (!invoice) {
      return Result.fail('INVOICE_NOT_FOUND');
    }

    // Convert DTO line items to domain format if provided
    const lineItems = input.lineItems?.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    }));

    // Update invoice
    const updateResult = invoice.update({
      date: input.date,
      dueDate: input.dueDate,
      lineItems,
      notes: input.notes,
    });

    if (updateResult.isFailure()) {
      return Result.fail(updateResult.getError());
    }

    // Save to repository
    await this.invoiceRepo.update(invoice);

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
      status: invoice.status,
      notes: invoice.notes,
      updatedAt: invoice.updatedAt,
    });
  }
}
