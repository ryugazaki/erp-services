import { DomainEvent } from '@erp/shared/kernel';

export class EmployeeStatusChanged extends DomainEvent {
  constructor(
    public readonly employeeId: string,
    public readonly newStatus: string,
  ) {
    super('hr.employee.status-changed');
  }
}
