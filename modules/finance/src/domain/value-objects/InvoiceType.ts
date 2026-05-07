import { Result } from '@erp/shared/kernel';

export type InvoiceTypeEnum = 'RECEIVABLE' | 'PAYABLE';

const VALID_TYPES: InvoiceTypeEnum[] = ['RECEIVABLE', 'PAYABLE'];

export class InvoiceType {
  private constructor(public readonly value: InvoiceTypeEnum) {}

  static create(rawValue: string): Result<InvoiceType> {
    const upperValue = rawValue.toUpperCase() as InvoiceTypeEnum;

    if (!VALID_TYPES.includes(upperValue)) {
      return Result.fail('INVOICE_TYPE_INVALID');
    }

    return Result.ok(new InvoiceType(upperValue));
  }

  static fromValue(value: InvoiceTypeEnum): InvoiceType {
    return new InvoiceType(value);
  }

  isReceivable(): boolean { return this.value === 'RECEIVABLE'; }
  isPayable(): boolean { return this.value === 'PAYABLE'; }

  equals(other: InvoiceType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
