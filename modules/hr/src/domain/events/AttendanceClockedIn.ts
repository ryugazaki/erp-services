import { DomainEvent } from '@erp/shared/kernel';

export class AttendanceClockedIn extends DomainEvent {
  constructor(
    public readonly employeeId: string,
    public readonly date: Date,
  ) {
    super('hr.attendance.clocked-in');
  }
}
