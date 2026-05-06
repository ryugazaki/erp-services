import { DomainEvent } from '@erp/shared/kernel';

export class EmployeeCreated extends DomainEvent {
  constructor(
    public readonly employeeId: string,
    public readonly employeeNumber: string,
    public readonly email: string,
  ) {
    super('hr.employee.created');
  }
}
