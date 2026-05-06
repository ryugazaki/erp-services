export type EmployeeStatusValue = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';

const VALID_STATUSES: EmployeeStatusValue[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'];

export class EmployeeStatus {
  private constructor(private readonly value: EmployeeStatusValue) {}

  static create(status: string): EmployeeStatus {
    const upper = status.toUpperCase() as EmployeeStatusValue;
    if (!VALID_STATUSES.includes(upper)) {
      throw new Error(`INVALID_EMPLOYEE_STATUS: ${status}`);
    }
    return new EmployeeStatus(upper);
  }

  getValue(): EmployeeStatusValue {
    return this.value;
  }

  equals(other: EmployeeStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
