import { Result } from '@erp/shared/kernel';

export type InvoiceStatusEnum = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

const VALID_STATUSES: InvoiceStatusEnum[] = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

const VALID_TRANSITIONS: Record<InvoiceStatusEnum, InvoiceStatusEnum[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['PAID', 'CANCELLED'],
  PAID: [],
  OVERDUE: ['PAID', 'CANCELLED'],
  CANCELLED: [],
};

export class InvoiceStatus {
  private constructor(public readonly value: InvoiceStatusEnum) {}

  static create(rawValue: string): Result<InvoiceStatus> {
    const upperValue = rawValue.toUpperCase() as InvoiceStatusEnum;

    if (!VALID_STATUSES.includes(upperValue)) {
      return Result.fail('INVOICE_STATUS_INVALID');
    }

    return Result.ok(new InvoiceStatus(upperValue));
  }

  static fromValue(value: InvoiceStatusEnum): InvoiceStatus {
    return new InvoiceStatus(value);
  }

  isDraft(): boolean { return this.value === 'DRAFT'; }
  isPending(): boolean { return this.value === 'PENDING'; }
  isPaid(): boolean { return this.value === 'PAID'; }
  isOverdue(): boolean { return this.value === 'OVERDUE'; }
  isCancelled(): boolean { return this.value === 'CANCELLED'; }

  canTransitionTo(status: InvoiceStatus): boolean {
    return VALID_TRANSITIONS[this.value].includes(status.value);
  }

  isFinal(): boolean {
    return this.isPaid() || this.isCancelled();
  }

  equals(other: InvoiceStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
