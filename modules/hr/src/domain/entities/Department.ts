import { AggregateRoot, Result } from '@erp/shared/kernel';
import { DepartmentCreated } from '../events/DepartmentCreated';

export interface DepartmentState {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDepartmentProps {
  name: string;
  code: string;
  description?: string;
  headId?: string;
}

interface UpdateDepartmentProps {
  name?: string;
  description?: string | null;
  headId?: string | null;
}

export class Department extends AggregateRoot {
  private constructor(private state: DepartmentState) {
    super();
  }

  get id(): string { return this.state.id; }
  get name(): string { return this.state.name; }
  get code(): string { return this.state.code; }
  get description(): string | null { return this.state.description; }
  get headId(): string | null { return this.state.headId; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateDepartmentProps): Result<Department> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('DEPARTMENT_NAME_REQUIRED');
    }
    if (!props.code || props.code.trim().length === 0) {
      return Result.fail('DEPARTMENT_CODE_REQUIRED');
    }

    const now = new Date();

    const department = new Department({
      id: crypto.randomUUID(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() ?? null,
      headId: props.headId ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    department.recordEvent(new DepartmentCreated(department.id, department.code));

    return Result.ok(department);
  }

  static reconstitute(state: DepartmentState): Department {
    return new Department(state);
  }

  updateDetails(props: UpdateDepartmentProps): Result<void> {
    if (props.name !== undefined && props.name.trim().length === 0) {
      return Result.fail('DEPARTMENT_NAME_REQUIRED');
    }

    if (props.name !== undefined) this.state.name = props.name.trim();
    if (props.description !== undefined) this.state.description = props.description?.trim() ?? null;
    if (props.headId !== undefined) this.state.headId = props.headId;
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  deactivate(): Result<void> {
    if (!this.state.isActive) return Result.fail('DEPARTMENT_ALREADY_INACTIVE');
    this.state.isActive = false;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  activate(): Result<void> {
    if (this.state.isActive) return Result.fail('DEPARTMENT_ALREADY_ACTIVE');
    this.state.isActive = true;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
