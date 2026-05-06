export type LeaveStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const VALID_STATUSES: LeaveStatusValue[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export class LeaveStatus {
  private constructor(private readonly value: LeaveStatusValue) {}

  static create(status: string): LeaveStatus {
    const upper = status.toUpperCase() as LeaveStatusValue;
    if (!VALID_STATUSES.includes(upper)) {
      throw new Error(`INVALID_LEAVE_STATUS: ${status}`);
    }
    return new LeaveStatus(upper);
  }

  getValue(): LeaveStatusValue {
    return this.value;
  }

  equals(other: LeaveStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
