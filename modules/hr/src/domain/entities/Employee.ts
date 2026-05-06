import { AggregateRoot, Result } from '@erp/shared/kernel';
import { EmployeeStatus } from '../value-objects/EmployeeStatus';
import { EmployeeCreated } from '../events/EmployeeCreated';
import { EmployeeStatusChanged } from '../events/EmployeeStatusChanged';

export interface EmployeeState {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string | null;
  position: string | null;
  hireDate: Date;
  status: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateEmployeeProps {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  hireDate: Date;
  userId?: string;
}

export class Employee extends AggregateRoot {
  private constructor(private state: EmployeeState) {
    super();
  }

  get id(): string { return this.state.id; }
  get employeeNumber(): string { return this.state.employeeNumber; }
  get firstName(): string { return this.state.firstName; }
  get lastName(): string { return this.state.lastName; }
  get email(): string { return this.state.email; }
  get phone(): string { return this.state.phone; }
  get departmentId(): string | null { return this.state.departmentId; }
  get position(): string | null { return this.state.position; }
  get hireDate(): Date { return this.state.hireDate; }
  get status(): string { return this.state.status; }
  get userId(): string | null { return this.state.userId; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateEmployeeProps): Result<Employee> {
    if (!props.firstName || props.firstName.trim().length === 0) {
      return Result.fail('FIRST_NAME_REQUIRED');
    }

    if (!props.lastName || props.lastName.trim().length === 0) {
      return Result.fail('LAST_NAME_REQUIRED');
    }

    if (!props.hireDate) {
      return Result.fail('HIRE_DATE_REQUIRED');
    }

    const status = EmployeeStatus.create('ACTIVE');
    const now = new Date();

    const employee = new Employee({
      id: crypto.randomUUID(),
      employeeNumber: props.employeeNumber,
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      phone: props.phone ?? '',
      departmentId: props.departmentId ?? null,
      position: props.position ?? null,
      hireDate: props.hireDate,
      status: status.getValue(),
      userId: props.userId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    employee.recordEvent(new EmployeeCreated(employee.id, employee.employeeNumber, employee.email));

    return Result.ok(employee);
  }

  static reconstitute(state: EmployeeState): Employee {
    return new Employee(state);
  }

  updateDetails(props: { firstName?: string; lastName?: string; phone?: string; departmentId?: string; position?: string }): Result<void> {
    if (props.firstName !== undefined) {
      if (!props.firstName || props.firstName.trim().length === 0) {
        return Result.fail('FIRST_NAME_REQUIRED');
      }
      this.state.firstName = props.firstName;
    }

    if (props.lastName !== undefined) {
      if (!props.lastName || props.lastName.trim().length === 0) {
        return Result.fail('LAST_NAME_REQUIRED');
      }
      this.state.lastName = props.lastName;
    }

    if (props.phone !== undefined) {
      this.state.phone = props.phone;
    }

    if (props.departmentId !== undefined) {
      this.state.departmentId = props.departmentId ?? null;
    }

    if (props.position !== undefined) {
      this.state.position = props.position ?? null;
    }

    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  changeStatus(newStatus: string): Result<void> {
    const status = EmployeeStatus.create(newStatus);

    this.state.status = status.getValue();
    this.state.updatedAt = new Date();

    this.recordEvent(new EmployeeStatusChanged(this.id, this.state.status));

    return Result.ok(undefined);
  }

  linkUser(userId: string): void {
    this.state.userId = userId;
    this.state.updatedAt = new Date();
  }
}
