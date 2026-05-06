import { AggregateRoot, Result } from '@erp/shared/kernel';
import { AttendanceClockedIn } from '../events/AttendanceClockedIn';
import { AttendanceClockedOut } from '../events/AttendanceClockedOut';

export interface AttendanceState {
  id: string;
  employeeId: string;
  date: Date;
  clockedInAt: Date;
  clockedOutAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAttendanceProps {
  employeeId: string;
  date: Date;
  clockedInAt: Date;
}

export class Attendance extends AggregateRoot {
  private constructor(private state: AttendanceState) {
    super();
  }

  get id(): string { return this.state.id; }
  get employeeId(): string { return this.state.employeeId; }
  get date(): Date { return this.state.date; }
  get clockedInAt(): Date { return this.state.clockedInAt; }
  get clockedOutAt(): Date | null { return this.state.clockedOutAt; }
  get status(): string { return this.state.status; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateAttendanceProps): Result<Attendance> {
    if (!props.employeeId) {
      return Result.fail('EMPLOYEE_ID_REQUIRED');
    }

    const now = new Date();

    const attendance = new Attendance({
      id: crypto.randomUUID(),
      employeeId: props.employeeId,
      date: props.date,
      clockedInAt: props.clockedInAt,
      clockedOutAt: null,
      status: 'CLOCKED_IN',
      createdAt: now,
      updatedAt: now,
    });

    attendance.recordEvent(new AttendanceClockedIn(attendance.employeeId, attendance.date));

    return Result.ok(attendance);
  }

  static reconstitute(state: AttendanceState): Attendance {
    return new Attendance(state);
  }

  clockOut(): Result<void> {
    if (this.state.status === 'CLOCKED_OUT') {
      return Result.fail('ATTENDANCE_ALREADY_CLOCKED_OUT');
    }

    this.state.clockedOutAt = new Date();
    this.state.status = 'CLOCKED_OUT';
    this.state.updatedAt = new Date();

    this.recordEvent(new AttendanceClockedOut(this.state.employeeId, this.state.date));

    return Result.ok(undefined);
  }
}
