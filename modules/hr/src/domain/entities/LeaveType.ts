import { AggregateRoot, Result } from '@erp/shared/kernel';

export interface LeaveTypeState {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLeaveTypeProps {
  name: string;
  code: string;
  defaultDays: number;
  description?: string;
  isPaid?: boolean;
}

export class LeaveType extends AggregateRoot {
  private constructor(private state: LeaveTypeState) {
    super();
  }

  get id(): string { return this.state.id; }
  get name(): string { return this.state.name; }
  get code(): string { return this.state.code; }
  get description(): string | null { return this.state.description; }
  get defaultDays(): number { return this.state.defaultDays; }
  get isPaid(): boolean { return this.state.isPaid; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateLeaveTypeProps): Result<LeaveType> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('LEAVE_TYPE_NAME_REQUIRED');
    }

    if (!props.code || props.code.trim().length === 0) {
      return Result.fail('LEAVE_TYPE_CODE_REQUIRED');
    }

    if (props.defaultDays < 0) {
      return Result.fail('LEAVE_TYPE_INVALID_DAYS');
    }

    const now = new Date();

    const leaveType = new LeaveType({
      id: crypto.randomUUID(),
      name: props.name,
      code: props.code,
      description: props.description ?? null,
      defaultDays: props.defaultDays,
      isPaid: props.isPaid ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(leaveType);
  }

  static reconstitute(state: LeaveTypeState): LeaveType {
    return new LeaveType(state);
  }

  update(props: { name?: string; description?: string; defaultDays?: number; isPaid?: boolean; isActive?: boolean }): Result<void> {
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        return Result.fail('LEAVE_TYPE_NAME_REQUIRED');
      }
      this.state.name = props.name;
    }

    if (props.description !== undefined) {
      this.state.description = props.description;
    }

    if (props.defaultDays !== undefined) {
      if (props.defaultDays < 0) {
        return Result.fail('LEAVE_TYPE_INVALID_DAYS');
      }
      this.state.defaultDays = props.defaultDays;
    }

    if (props.isPaid !== undefined) {
      this.state.isPaid = props.isPaid;
    }

    if (props.isActive !== undefined) {
      this.state.isActive = props.isActive;
    }

    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
