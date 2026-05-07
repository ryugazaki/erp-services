import { Result } from '@erp/shared/kernel';

export type AccountTypeEnum = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

const VALID_TYPES: AccountTypeEnum[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export class AccountType {
  private constructor(public readonly value: AccountTypeEnum) {}

  static create(rawValue: string): Result<AccountType> {
    const upperValue = rawValue.toUpperCase() as AccountTypeEnum;

    if (!VALID_TYPES.includes(upperValue)) {
      return Result.fail('ACCOUNT_TYPE_INVALID');
    }

    return Result.ok(new AccountType(upperValue));
  }

  static fromValue(value: AccountTypeEnum): AccountType {
    return new AccountType(value);
  }

  isAsset(): boolean { return this.value === 'ASSET'; }
  isLiability(): boolean { return this.value === 'LIABILITY'; }
  isEquity(): boolean { return this.value === 'EQUITY'; }
  isRevenue(): boolean { return this.value === 'REVENUE'; }
  isExpense(): boolean { return this.value === 'EXPENSE'; }

  isBalanceSheetAccount(): boolean {
    return this.isAsset() || this.isLiability() || this.isEquity();
  }

  isIncomeStatementAccount(): boolean {
    return this.isRevenue() || this.isExpense();
  }

  normalBalanceIsDebit(): boolean {
    return this.isAsset() || this.isExpense();
  }

  normalBalanceIsCredit(): boolean {
    return this.isLiability() || this.isEquity() || this.isRevenue();
  }

  equals(other: AccountType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
