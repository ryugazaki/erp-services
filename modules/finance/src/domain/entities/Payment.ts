import { AggregateRoot, Result } from '@erp/shared/kernel';
import { Money } from '../value-objects/Money';
import { PaymentRecorded } from '../events/PaymentRecorded';

export type PaymentMethodEnum = 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'CARD' | 'E_WALLET' | 'OTHER';

export interface PaymentState {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface CreatePaymentProps {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export class Payment extends AggregateRoot {
  private constructor(private state: PaymentState) {
    super();
  }

  get id(): string { return this.state.id; }
  get invoiceId(): string { return this.state.invoiceId; }
  get amount(): number { return this.state.amount; }
  get paymentDate(): Date { return this.state.paymentDate; }
  get paymentMethod(): string { return this.state.paymentMethod; }
  get reference(): string | null { return this.state.reference; }
  get notes(): string | null { return this.state.notes; }
  get createdAt(): Date { return this.state.createdAt; }

  static create(props: CreatePaymentProps): Result<Payment> {
    if (!props.invoiceId || props.invoiceId.trim().length === 0) {
      return Result.fail('PAYMENT_INVOICE_ID_REQUIRED');
    }

    const amountResult = Money.create(props.amount);
    if (amountResult.isFailure()) {
      return Result.fail('PAYMENT_AMOUNT_INVALID');
    }

    const amount = amountResult.getValue();
    if (amount.isZero()) {
      return Result.fail('PAYMENT_AMOUNT_ZERO');
    }

    const now = new Date();
    const payment = new Payment({
      id: crypto.randomUUID(),
      invoiceId: props.invoiceId.trim(),
      amount: amount.amount,
      paymentDate: props.paymentDate,
      paymentMethod: props.paymentMethod,
      reference: props.reference?.trim() || null,
      notes: props.notes?.trim() || null,
      createdAt: now,
    });

    payment.recordEvent(new PaymentRecorded(
      payment.id,
      payment.invoiceId,
      payment.amount,
      payment.paymentDate,
    ));

    return Result.ok(payment);
  }

  static reconstitute(state: PaymentState): Payment {
    return new Payment(state);
  }
}
