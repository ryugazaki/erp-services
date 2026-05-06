import { Result } from '@erp/shared/kernel';

export class DateRange {
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}

  static create(startDate: Date, endDate: Date): Result<DateRange> {
    if (endDate < startDate) {
      return Result.fail('INVALID_DATE_RANGE');
    }

    return Result.ok(new DateRange(startDate, endDate));
  }

  totalDays(): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = this.endDate.getTime() - this.startDate.getTime();
    const days = Math.floor(diffMs / msPerDay);
    return days + 1;
  }

  equals(other: DateRange): boolean {
    return this.startDate.getTime() === other.startDate.getTime() && this.endDate.getTime() === other.endDate.getTime();
  }

  toString(): string {
    return `${this.startDate.toISOString()} - ${this.endDate.toISOString()}`;
  }
}
