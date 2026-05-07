import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository';
import { Payment } from '../../../domain/entities/Payment';

export interface GetInvoicePaymentsDTO {
  invoiceId: string;
}

export interface PaymentResult {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export class GetInvoicePaymentsUseCase implements IUseCase<GetInvoicePaymentsDTO, Result<PaymentResult[]>> {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
  ) {}

  async execute(dto: GetInvoicePaymentsDTO): Promise<Result<PaymentResult[]>> {
    const payments = await this.paymentRepo.findByInvoiceId(dto.invoiceId);

    const results: PaymentResult[] = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      createdAt: payment.createdAt,
    }));

    return Result.ok(results);
  }
}
