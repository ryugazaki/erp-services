import { DomainEvent } from '@erp/shared/kernel';

export class StockMovementCreated extends DomainEvent {
  constructor(
    public readonly movementId: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly movementType: string,
    public readonly quantity: number,
  ) {
    super('inventory.stock-movement.created');
  }
}
