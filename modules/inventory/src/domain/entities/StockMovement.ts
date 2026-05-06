import { AggregateRoot, Result } from '@erp/shared/kernel';
import { StockMovementCreated } from '../events/StockMovementCreated';
import { MovementType } from '../value-objects/MovementType';

export interface StockMovementState {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  occurredAt: Date;
  createdAt: Date;
}

interface CreateStockMovementProps {
  productId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  occurredAt?: Date;
}

export class StockMovement extends AggregateRoot {
  private constructor(private state: StockMovementState) {
    super();
  }

  get id(): string { return this.state.id; }
  get productId(): string { return this.state.productId; }
  get warehouseId(): string { return this.state.warehouseId; }
  get movementType(): string { return this.state.movementType; }
  get quantity(): number { return this.state.quantity; }
  get referenceType(): string | null { return this.state.referenceType; }
  get referenceId(): string | null { return this.state.referenceId; }
  get notes(): string | null { return this.state.notes; }
  get occurredAt(): Date { return this.state.occurredAt; }
  get createdAt(): Date { return this.state.createdAt; }

  static create(props: CreateStockMovementProps): Result<StockMovement> {
    if (!props.productId) return Result.fail('PRODUCT_ID_REQUIRED');
    if (!props.warehouseId) return Result.fail('WAREHOUSE_ID_REQUIRED');
    if (!props.movementType) return Result.fail('MOVEMENT_TYPE_REQUIRED');
    if (props.quantity === 0) return Result.fail('QUANTITY_REQUIRED');
    if (props.quantity < 0) return Result.fail('INVALID_QUANTITY');

    const movementTypeObj = MovementType.create(props.movementType);
    const now = new Date();
    const movement = new StockMovement({
      id: crypto.randomUUID(),
      productId: props.productId,
      warehouseId: props.warehouseId,
      movementType: movementTypeObj.getValue(),
      quantity: props.quantity,
      referenceType: props.referenceType || null,
      referenceId: props.referenceId || null,
      notes: props.notes?.trim() || null,
      occurredAt: props.occurredAt || now,
      createdAt: now,
    });

    movement.recordEvent(new StockMovementCreated(
      movement.id,
      movement.productId,
      movement.warehouseId,
      movement.movementType,
      movement.quantity,
    ));

    return Result.ok(movement);
  }

  static reconstitute(state: StockMovementState): StockMovement {
    return new StockMovement(state);
  }
}
