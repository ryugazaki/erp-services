import { AggregateRoot, Result } from '@erp/shared/kernel';
import { ProductCreated } from '../events/ProductCreated';
import { ProductUpdated } from '../events/ProductUpdated';
import { ProductDeleted } from '../events/ProductDeleted';
import { SKU } from '../value-objects/SKU';

export interface ProductState {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unitOfMeasure: string;
  basePrice: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProductProps {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure: string;
  basePrice?: number;
  minimumStock?: number;
}

export class Product extends AggregateRoot {
  private constructor(private state: ProductState) {
    super();
  }

  get id(): string { return this.state.id; }
  get sku(): string { return this.state.sku; }
  get name(): string { return this.state.name; }
  get description(): string | null { return this.state.description; }
  get categoryId(): string | null { return this.state.categoryId; }
  get unitOfMeasure(): string { return this.state.unitOfMeasure; }
  get basePrice(): number { return this.state.basePrice; }
  get minimumStock(): number { return this.state.minimumStock; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateProductProps): Result<Product> {
    const skuResult = SKU.create(props.sku);
    if (skuResult.isFailure()) return Result.fail(skuResult.getError());

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('PRODUCT_NAME_REQUIRED');
    }

    const now = new Date();
    const product = new Product({
      id: crypto.randomUUID(),
      sku: skuResult.getValue().getValue(),
      name: props.name.trim(),
      description: props.description?.trim() || null,
      categoryId: props.categoryId || null,
      unitOfMeasure: props.unitOfMeasure,
      basePrice: props.basePrice ?? 0,
      minimumStock: props.minimumStock ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    product.recordEvent(new ProductCreated(product.id, product.sku, product.name));

    return Result.ok(product);
  }

  static reconstitute(state: ProductState): Product {
    return new Product(state);
  }

  updateDetails(props: {
    name?: string;
    description?: string;
    categoryId?: string | null;
    unitOfMeasure?: string;
    basePrice?: number;
    minimumStock?: number;
  }): Result<void> {
    if (props.name !== undefined) {
      if (props.name.trim().length === 0) return Result.fail('PRODUCT_NAME_REQUIRED');
      this.state.name = props.name.trim();
    }
    if (props.description !== undefined) {
      this.state.description = props.description.trim() || null;
    }
    if (props.categoryId !== undefined) {
      this.state.categoryId = props.categoryId || null;
    }
    if (props.unitOfMeasure !== undefined) {
      this.state.unitOfMeasure = props.unitOfMeasure;
    }
    if (props.basePrice !== undefined) {
      if (props.basePrice < 0) return Result.fail('INVALID_BASE_PRICE');
      this.state.basePrice = props.basePrice;
    }
    if (props.minimumStock !== undefined) {
      if (props.minimumStock < 0) return Result.fail('INVALID_MINIMUM_STOCK');
      this.state.minimumStock = props.minimumStock;
    }
    this.state.updatedAt = new Date();

    this.recordEvent(new ProductUpdated(this.state.id, this.state.sku));

    return Result.ok(undefined);
  }

  deactivate(): Result<void> {
    if (!this.state.isActive) return Result.fail('PRODUCT_ALREADY_INACTIVE');
    this.state.isActive = false;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  activate(): Result<void> {
    if (this.state.isActive) return Result.fail('PRODUCT_ALREADY_ACTIVE');
    this.state.isActive = true;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  markAsDeleted(): Result<void> {
    if (!this.state.isActive) return Result.fail('PRODUCT_ALREADY_INACTIVE');
    this.state.isActive = false;
    this.state.updatedAt = new Date();

    this.recordEvent(new ProductDeleted(this.state.id, this.state.sku));

    return Result.ok(undefined);
  }
}
