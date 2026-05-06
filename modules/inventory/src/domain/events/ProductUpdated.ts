import { DomainEvent } from '@erp/shared/kernel';

export class ProductUpdated extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
  ) {
    super('inventory.product.updated');
  }
}
