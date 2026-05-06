import { DomainEvent } from '@erp/shared/kernel';

export class ProductDeleted extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
  ) {
    super('inventory.product.deleted');
  }
}
