import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { InvoiceStatus } from '../../../domain/value-objects/InvoiceStatus';
import { ChangeInvoiceStatusDTO } from '../../dtos';

export interface ChangeInvoiceStatusInput extends ChangeInvoiceStatusDTO {
  invoiceId: string;
}

export interface InvoiceResult {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  updatedAt: Date;
}

export class ChangeInvoiceStatusUseCase implements IUseCase<ChangeInvoiceStatusInput, Result<InvoiceResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ChangeInvoiceStatusInput): Promise<Result<InvoiceResult>> {
    const invoice = await this.invoiceRepo.findById(input.invoiceId);

    if (!invoice) {
      return Result.fail('INVOICE_NOT_FOUND');
    }

    const currentStatus = invoice.getStatusValue();
    const newStatus = InvoiceStatus.fromValue(input.status as any);

    // Validate status transition
    if (!currentStatus.canTransitionTo(newStatus)) {
      return Result.fail('INVOICE_INVALID_STATUS_TRANSITION');
    }

    // Handle status changes
    switch (input.status) {
      case 'PENDING':
        const validateResult = invoice.validate();
        if (validateResult.isFailure()) {
          return Result.fail(validateResult.getError());
        }
        break;

      case 'PAID':
        const paidResult = invoice.markAsPaid();
        if (paidResult.isFailure()) {
          return Result.fail(paidResult.getError());
        }
        break;

      case 'CANCELLED':
        const cancelResult = invoice.cancel();
        if (cancelResult.isFailure()) {
          return Result.fail(cancelResult.getError());
        }
        break;

      case 'DRAFT':
        return Result.fail('INVOICE_INVALID_STATUS_TRANSITION');
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
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      updatedAt: invoice.updatedAt,
    });
  }
}
