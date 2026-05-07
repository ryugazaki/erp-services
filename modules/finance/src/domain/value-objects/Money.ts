import { Result } from '@erp/shared/kernel';

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string = 'IDR',
  ) {}

  static create(amount: number, currency: string = 'IDR'): Result<Money> {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return Result.fail('MONEY_AMOUNT_INVALID');
    }

    if (amount < 0) {
      return Result.fail('MONEY_AMOUNT_NEGATIVE');
    }

    // Round to 2 decimal places for precision
    const rounded = Math.round(amount * 100) / 100;

    return Result.ok(new Money(rounded, currency.toUpperCase()));
  }

  static zero(currency: string = 'IDR'): Money {
    return new Money(0, currency.toUpperCase());
  }

  add(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('MONEY_CURRENCY_MISMATCH');
    }

    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('MONEY_CURRENCY_MISMATCH');
    }

    const result = this.amount - other.amount;
    if (result < 0) {
      return Result.fail('MONEY_SUBTRACT_UNDERFLOW');
    }

    return Money.create(result, this.currency);
  }

  multiply(factor: number): Result<Money> {
    if (factor < 0) {
      return Result.fail('MONEY_MULTIPLY_NEGATIVE');
    }

    return Money.create(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  greaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this.amount > other.amount;
  }

  lessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this.amount < other.amount;
  }

  toFormattedString(locale: string = 'id-ID'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
