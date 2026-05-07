import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository';

export interface GetInvoiceDTO {
  id: string;
}

export interface InvoiceLineItemResult {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
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

export interface InvoiceResult {
  id: string;
  invoiceNumber: string;
  type: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  lineItems: InvoiceLineItemResult[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments: PaymentResult[];
}

export class GetInvoiceUseCase implements IUseCase<GetInvoiceDTO, Result<InvoiceResult>> {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentRepo: IPaymentRepository,
  ) {}

  async execute(dto: GetInvoiceDTO): Promise<Result<InvoiceResult>> {
    const invoice = await this.invoiceRepo.findById(dto.id);

    if (!invoice) {
      return Result.fail('INVOICE_NOT_FOUND');
    }

    // Get payments for this invoice
    const payments = await this.paymentRepo.findByInvoiceId(dto.id);

    const lineItems: InvoiceLineItemResult[] = invoice.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      total: item.total,
    }));

    const paymentResults: PaymentResult[] = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      createdAt: payment.createdAt,
    }));

    return Result.ok({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      date: invoice.date,
      dueDate: invoice.dueDate,
      lineItems,
      subTotal: invoice.subTotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
      status: invoice.status,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      payments: paymentResults,
    });
  }
}
