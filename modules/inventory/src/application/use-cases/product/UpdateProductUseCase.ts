import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IEventBus } from '@erp/core/event-bus';
import { UpdateProductDTO } from '../../dtos/product/UpdateProductDTO';

export interface UpdateProductInput extends UpdateProductDTO {
  id: string;
}

export interface UpdateProductResult {
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
export class UpdateProductUseCase implements IUseCase<UpdateProductInput, Result<UpdateProductResult>> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateProductInput): Promise<Result<UpdateProductResult>> {
    const product = await this.productRepo.findById(input.id);
    if (!product) return Result.fail('PRODUCT_NOT_FOUND');

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) return Result.fail('CATEGORY_NOT_FOUND');
    }

    const result = product.updateDetails(input);
    if (result.isFailure()) return Result.fail(result.getError());

    await this.productRepo.update(product);

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
