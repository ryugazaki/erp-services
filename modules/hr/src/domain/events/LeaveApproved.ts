import { DomainEvent } from '@erp/shared/kernel';

export class LeaveApproved extends DomainEvent {
  constructor(
    public readonly leaveId: string,
    public readonly employeeId: string,
    public readonly approvedBy: string,
  ) {
    super('hr.leave.approved');
  }
}
