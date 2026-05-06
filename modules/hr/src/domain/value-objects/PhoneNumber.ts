import { Result } from '@erp/shared/kernel';

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static create(raw: string | undefined | null): Result<PhoneNumber> {
    if (!raw || raw.trim().length === 0) {
      return Result.ok(new PhoneNumber(''));
    }

    const normalized = raw.trim();
    const phoneRegex = /^\+?\d{7,15}$/;

    if (!phoneRegex.test(normalized)) {
      return Result.fail('PHONE_INVALID_FORMAT');
    }

    return Result.ok(new PhoneNumber(normalized));
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
