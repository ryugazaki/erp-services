import { DomainEvent } from '@erp/shared/kernel';

export class LeaveCancelled extends DomainEvent {
  constructor(
    public readonly leaveId: string,
    public readonly employeeId: string,
  ) {
    super('hr.leave.cancelled');
  }
}
