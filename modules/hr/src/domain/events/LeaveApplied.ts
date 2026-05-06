import { DomainEvent } from '@erp/shared/kernel';

export class LeaveApplied extends DomainEvent {
  constructor(
    public readonly leaveId: string,
    public readonly employeeId: string,
    public readonly leaveTypeId: string,
  ) {
    super('hr.leave.applied');
  }
}
