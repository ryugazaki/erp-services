import { AggregateRoot, Result } from '@erp/shared/kernel';
import { LeaveStatus } from '../value-objects/LeaveStatus';
import { LeaveApplied } from '../events/LeaveApplied';
import { LeaveApproved } from '../events/LeaveApproved';
import { LeaveRejected } from '../events/LeaveRejected';
import { LeaveCancelled } from '../events/LeaveCancelled';

export interface LeaveState {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  remarks: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLeaveProps {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
}

export class Leave extends AggregateRoot {
  private constructor(private state: LeaveState) {
    super();
  }

  get id(): string { return this.state.id; }
  get employeeId(): string { return this.state.employeeId; }
  get leaveTypeId(): string { return this.state.leaveTypeId; }
  get startDate(): Date { return this.state.startDate; }
  get endDate(): Date { return this.state.endDate; }
  get totalDays(): number { return this.state.totalDays; }
  get reason(): string | null { return this.state.reason; }
  get status(): string { return this.state.status; }
  get approvedBy(): string | null { return this.state.approvedBy; }
  get approvedAt(): Date | null { return this.state.approvedAt; }
  get remarks(): string | null { return this.state.remarks; }
  get cancelledAt(): Date | null { return this.state.cancelledAt; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateLeaveProps): Result<Leave> {
    if (props.totalDays <= 0) {
      return Result.fail('INVALID_TOTAL_DAYS');
    }

    const status = LeaveStatus.create('PENDING');
    const now = new Date();

    const leave = new Leave({
      id: crypto.randomUUID(),
      employeeId: props.employeeId,
      leaveTypeId: props.leaveTypeId,
      startDate: props.startDate,
      endDate: props.endDate,
      totalDays: props.totalDays,
      reason: props.reason ?? null,
      status: status.getValue(),
      approvedBy: null,
      approvedAt: null,
      remarks: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    leave.recordEvent(new LeaveApplied(leave.id, leave.employeeId, leave.leaveTypeId));

    return Result.ok(leave);
  }

  static reconstitute(state: LeaveState): Leave {
    return new Leave(state);
  }

  approve(approvedBy: string, remarks?: string): Result<void> {
    if (this.state.status !== 'PENDING') {
      return Result.fail('LEAVE_ALREADY_PROCESSED');
    }

    this.state.status = LeaveStatus.create('APPROVED').getValue();
    this.state.approvedBy = approvedBy;
    this.state.approvedAt = new Date();
    this.state.remarks = remarks ?? null;
    this.state.updatedAt = new Date();

    this.recordEvent(new LeaveApproved(this.id, this.employeeId, approvedBy));

    return Result.ok(undefined);
  }

  reject(rejectedBy: string, remarks?: string): Result<void> {
    if (this.state.status !== 'PENDING') {
      return Result.fail('LEAVE_ALREADY_PROCESSED');
    }

    this.state.status = LeaveStatus.create('REJECTED').getValue();
    this.state.approvedBy = rejectedBy;
    this.state.approvedAt = new Date();
    this.state.remarks = remarks ?? null;
    this.state.updatedAt = new Date();

    this.recordEvent(new LeaveRejected(this.id, this.employeeId, rejectedBy));

    return Result.ok(undefined);
  }

  cancel(): Result<void> {
    if (this.state.status !== 'PENDING' && this.state.status !== 'APPROVED') {
      return Result.fail('LEAVE_CANNOT_CANCEL');
    }

    this.state.status = LeaveStatus.create('CANCELLED').getValue();
    this.state.cancelledAt = new Date();
    this.state.updatedAt = new Date();

    this.recordEvent(new LeaveCancelled(this.id, this.employeeId));

    return Result.ok(undefined);
  }
}
