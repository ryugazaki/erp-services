import { DomainEvent } from '@erp/shared/kernel';

export class LeaveRejected extends DomainEvent {
  constructor(
    public readonly leaveId: string,
    public readonly employeeId: string,
    public readonly rejectedBy: string,
  ) {
    super('hr.leave.rejected');
  }
}
