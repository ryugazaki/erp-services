import { Result } from '@erp/shared/kernel';

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email> {
    if (!raw || raw.trim().length === 0) {
      return Result.fail('EMAIL_EMPTY');
    }

    const normalized = raw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      return Result.fail('EMAIL_INVALID_FORMAT');
    }

    return Result.ok(new Email(normalized));
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
