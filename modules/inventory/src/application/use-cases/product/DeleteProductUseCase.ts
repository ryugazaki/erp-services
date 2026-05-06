import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IEventBus } from '@erp/core/event-bus';

export interface DeleteProductInput {
  id: string;
}

export interface DeleteProductResult {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
}

@injectable()
export class DeleteProductUseCase implements IUseCase<DeleteProductInput, Result<DeleteProductResult>> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: DeleteProductInput): Promise<Result<DeleteProductResult>> {
    const product = await this.productRepo.findById(input.id);
    if (!product) return Result.fail('PRODUCT_NOT_FOUND');

    const result = product.markAsDeleted();
    if (result.isFailure()) return Result.fail(result.getError());

    await this.productRepo.update(product);

    for (const event of product.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: product.id,
      sku: product.sku,
      name: product.name,
      isActive: product.isActive,
    });
  }
}
