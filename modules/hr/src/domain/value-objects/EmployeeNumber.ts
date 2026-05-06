import { Result } from '@erp/shared/kernel';

export class EmployeeNumber {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<EmployeeNumber> {
    if (!raw || raw.trim().length === 0) {
      return Result.fail('EMPLOYEE_NUMBER_EMPTY');
    }

    const normalized = raw.trim();

    if (normalized.length > 20) {
      return Result.fail('EMPLOYEE_NUMBER_TOO_LONG');
    }

    const employeeNumberRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!employeeNumberRegex.test(normalized)) {
      return Result.fail('EMPLOYEE_NUMBER_INVALID_FORMAT');
    }

    return Result.ok(new EmployeeNumber(normalized));
  }

  equals(other: EmployeeNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
