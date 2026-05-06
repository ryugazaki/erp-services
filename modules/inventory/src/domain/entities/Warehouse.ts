import { AggregateRoot, Result } from '@erp/shared/kernel';

export interface WarehouseState {
  id: string;
  name: string;
  code: string;
  address: string | null;
  locationId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWarehouseProps {
  name: string;
  code: string;
  address?: string;
  locationId?: string;
}

export class Warehouse extends AggregateRoot {
  private constructor(private state: WarehouseState) {
    super();
  }

  get id(): string { return this.state.id; }
  get name(): string { return this.state.name; }
  get code(): string { return this.state.code; }
  get address(): string | null { return this.state.address; }
  get locationId(): string | null { return this.state.locationId; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateWarehouseProps): Result<Warehouse> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('WAREHOUSE_NAME_REQUIRED');
    }
    if (!props.code || props.code.trim().length === 0) {
      return Result.fail('WAREHOUSE_CODE_REQUIRED');
    }

    const now = new Date();
    const warehouse = new Warehouse({
      id: crypto.randomUUID(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      address: props.address?.trim() || null,
      locationId: props.locationId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(warehouse);
  }

  static reconstitute(state: WarehouseState): Warehouse {
    return new Warehouse(state);
  }

  updateDetails(props: { name?: string; address?: string; locationId?: string }): Result<void> {
    if (props.name !== undefined) {
      if (props.name.trim().length === 0) return Result.fail('WAREHOUSE_NAME_REQUIRED');
      this.state.name = props.name.trim();
    }
    if (props.address !== undefined) {
      this.state.address = props.address.trim() || null;
    }
    if (props.locationId !== undefined) {
      this.state.locationId = props.locationId || null;
    }
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  deactivate(): Result<void> {
    if (!this.state.isActive) return Result.fail('WAREHOUSE_ALREADY_INACTIVE');
    this.state.isActive = false;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  activate(): Result<void> {
    if (this.state.isActive) return Result.fail('WAREHOUSE_ALREADY_ACTIVE');
    this.state.isActive = true;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
