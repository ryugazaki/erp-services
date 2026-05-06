import { AggregateRoot, Result } from '@erp/shared/kernel';

export interface LeaveBalanceState {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLeaveBalanceProps {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
}

export class LeaveBalance extends AggregateRoot {
  private constructor(private state: LeaveBalanceState) {
    super();
  }

  get id(): string { return this.state.id; }
  get employeeId(): string { return this.state.employeeId; }
  get leaveTypeId(): string { return this.state.leaveTypeId; }
  get year(): number { return this.state.year; }
  get totalDays(): number { return this.state.totalDays; }
  get usedDays(): number { return this.state.usedDays; }
  get remainingDays(): number { return this.state.remainingDays; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateLeaveBalanceProps): Result<LeaveBalance> {
    if (props.year < 2000) {
      return Result.fail('INVALID_YEAR');
    }

    if (props.totalDays <= 0) {
      return Result.fail('INVALID_TOTAL_DAYS');
    }

    const now = new Date();

    const balance = new LeaveBalance({
      id: crypto.randomUUID(),
      employeeId: props.employeeId,
      leaveTypeId: props.leaveTypeId,
      year: props.year,
      totalDays: props.totalDays,
      usedDays: 0,
      remainingDays: props.totalDays,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(balance);
  }

  static reconstitute(state: LeaveBalanceState): LeaveBalance {
    return new LeaveBalance(state);
  }

  use(days: number): Result<void> {
    if (days <= 0) {
      return Result.fail('LEAVE_BALANCE_INVALID_DAYS');
    }

    if (this.state.remainingDays < days) {
      return Result.fail('INSUFFICIENT_LEAVE_BALANCE');
    }

    this.state.usedDays += days;
    this.state.remainingDays -= days;
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  restore(days: number): Result<void> {
    if (days <= 0) {
      return Result.fail('LEAVE_BALANCE_INVALID_DAYS');
    }

    this.state.usedDays = Math.max(0, this.state.usedDays - days);
    this.state.remainingDays += days;
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
