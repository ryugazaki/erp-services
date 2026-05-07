import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository';
import { Payment } from '../../../domain/entities/Payment';
import { RecordPaymentDTO } from '../../dtos';

export interface RecordPaymentInput {
  invoiceId: string;
}

export interface PaymentResult {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface RecordPaymentUseCaseResult {
  payment: PaymentResult;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: string;
  };
}

export class RecordPaymentUseCase implements IUseCase<RecordPaymentInput & RecordPaymentDTO, Result<RecordPaymentUseCaseResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RecordPaymentInput & RecordPaymentDTO): Promise<Result<RecordPaymentUseCaseResult>> {
    const invoice = await this.invoiceRepo.findById(input.invoiceId);

    if (!invoice) {
      return Result.fail('INVOICE_NOT_FOUND');
    }

    // Create payment
    const paymentResult = Payment.create({
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      notes: input.notes,
    });

    if (paymentResult.isFailure()) {
      return Result.fail(paymentResult.getError());
    }

    const payment = paymentResult.getValue();

    // Record payment on invoice
    const recordPaymentResult = invoice.recordPayment(input.amount, payment.id);

    if (recordPaymentResult.isFailure()) {
      return Result.fail(recordPaymentResult.getError());
    }

    // Save payment
    await this.paymentRepo.save(payment);

    // Save invoice
    await this.invoiceRepo.update(invoice);

    // Pull and publish domain events from both
    const events = [...invoice.pullEvents(), ...payment.pullEvents()];
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      payment: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        notes: payment.notes,
        createdAt: payment.createdAt,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        outstandingAmount: invoice.outstandingAmount,
        status: invoice.status,
      },
    });
  }
}
