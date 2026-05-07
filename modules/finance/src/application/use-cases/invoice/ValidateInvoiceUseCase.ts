import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { InvoiceStatus } from '../../../domain/value-objects/InvoiceStatus';

export interface ValidateInvoiceDTO {
  invoiceId: string;
}

export interface InvoiceResult {
  id: string;
  invoiceNumber: string;
  type: string;
  totalAmount: number;
  status: string;
  updatedAt: Date;
}

export class ValidateInvoiceUseCase implements IUseCase<ValidateInvoiceDTO, Result<InvoiceResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: ValidateInvoiceDTO): Promise<Result<InvoiceResult>> {
    const invoice = await this.invoiceRepo.findById(dto.invoiceId);

    if (!invoice) {
      return Result.fail('INVOICE_NOT_FOUND');
    }

    // Validate invoice (DRAFT → PENDING)
    const validateResult = invoice.validate();

    if (validateResult.isFailure()) {
      return Result.fail(validateResult.getError());
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
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      updatedAt: invoice.updatedAt,
    });
  }
}
