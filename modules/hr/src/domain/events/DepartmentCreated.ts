import { DomainEvent } from '@erp/shared/kernel';

export class DepartmentCreated extends DomainEvent {
  constructor(
    public readonly departmentId: string,
    public readonly code: string,
  ) {
    super('hr.department.created');
  }
}
