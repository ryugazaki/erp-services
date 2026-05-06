import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';

export interface GetProductInput {
  id: string;
}

export interface GetProductResult {
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
export class GetProductUseCase implements IUseCase<GetProductInput, Result<GetProductResult>> {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: GetProductInput): Promise<Result<GetProductResult>> {
    const product = await this.productRepo.findById(input.id);
    if (!product) return Result.fail('PRODUCT_NOT_FOUND');

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
