export type AttendanceStatusValue = 'CLOCKED_IN' | 'CLOCKED_OUT' | 'ABSENT';

const VALID_STATUSES: AttendanceStatusValue[] = ['CLOCKED_IN', 'CLOCKED_OUT', 'ABSENT'];

export class AttendanceStatus {
  private constructor(private readonly value: AttendanceStatusValue) {}

  static create(status: string): AttendanceStatus {
    const upper = status.toUpperCase() as AttendanceStatusValue;
    if (!VALID_STATUSES.includes(upper)) {
      throw new Error(`INVALID_ATTENDANCE_STATUS: ${status}`);
    }
    return new AttendanceStatus(upper);
  }

  getValue(): AttendanceStatusValue {
    return this.value;
  }

  equals(other: AttendanceStatus): boolean {
    return this.value === other.value;
  }

  toString(): AttendanceStatusValue {
    return this.value;
  }
}
