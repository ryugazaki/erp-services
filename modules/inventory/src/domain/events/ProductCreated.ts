import { DomainEvent } from '@erp/shared/kernel';

export class ProductCreated extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
    public readonly name: string,
  ) {
    super('inventory.product.created');
  }
}
