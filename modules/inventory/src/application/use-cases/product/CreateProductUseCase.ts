import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { Product } from '../../../domain/entities/Product';
import { IEventBus } from '@erp/core/event-bus';
import { CreateProductDTO } from '../../dtos/product/CreateProductDTO';

export interface CreateProductInput extends CreateProductDTO {}

export interface CreateProductResult {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unitOfMeasure: string;
  basePrice: number;
  minimumStock: number;
  isActive: boolean;
}

@injectable()
export class CreateProductUseCase implements IUseCase<CreateProductInput, Result<CreateProductResult>> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateProductInput): Promise<Result<CreateProductResult>> {
    const existingProduct = await this.productRepo.findBySKU(input.sku);
    if (existingProduct) return Result.fail('SKU_ALREADY_EXISTS');

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) return Result.fail('CATEGORY_NOT_FOUND');
    }

    const productResult = Product.create({
      sku: input.sku,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      unitOfMeasure: input.unitOfMeasure,
      basePrice: input.basePrice,
      minimumStock: input.minimumStock,
    });

    if (productResult.isFailure()) return Result.fail(productResult.getError());

    const product = productResult.getValue();
    await this.productRepo.save(product);

    for (const event of product.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      unitOfMeasure: product.unitOfMeasure,
      basePrice: product.basePrice,
      minimumStock: product.minimumStock,
      isActive: product.isActive,
    });
  }
}
