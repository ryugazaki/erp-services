import { Result } from '@erp/shared/kernel';

export class AccountCode {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<AccountCode> {
    if (!raw || raw.trim().length === 0) {
      return Result.fail('ACCOUNT_CODE_EMPTY');
    }

    const normalized = raw.trim().toUpperCase();

    // Format: X-XXXX or X-XXXX-XX (segment-separated by hyphens)
    const codeRegex = /^\d+(?:-\d+)*$/;

    if (!codeRegex.test(normalized)) {
      return Result.fail('ACCOUNT_CODE_INVALID_FORMAT');
    }

    return Result.ok(new AccountCode(normalized));
  }

  static fromValue(value: string): AccountCode {
    return new AccountCode(value);
  }

  getSegments(): string[] {
    return this.value.split('-');
  }

  getLevel(): number {
    return this.getSegments().length;
  }

  isParentOf(otherCode: AccountCode): boolean {
    const mySegments = this.getSegments();
    const otherSegments = otherCode.getSegments();

    if (mySegments.length >= otherSegments.length) {
      return false;
    }

    for (let i = 0; i < mySegments.length; i++) {
      if (mySegments[i] !== otherSegments[i]) {
        return false;
      }
    }

    return true;
  }

  isChildOf(otherCode: AccountCode): boolean {
    return otherCode.isParentOf(this);
  }

  equals(other: AccountCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
