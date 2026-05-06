import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IProductRepository, ProductFilter } from '../../../domain/repositories/IProductRepository';
import { ListProductsDTO } from '../../dtos/product/ListProductsDTO';
import { PaginatedResult } from '@erp/shared/kernel';

export interface ListProductsInput extends ListProductsDTO {}

export interface ListProductsResult {
  items: Array<{
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    unitOfMeasure: string;
    basePrice: number;
    minimumStock: number;
    isActive: boolean;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@injectable()
export class ListProductsUseCase implements IUseCase<ListProductsInput, Result<ListProductsResult>> {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: ListProductsInput): Promise<Result<ListProductsResult>> {
    const filter: ProductFilter = {
      categoryId: input.categoryId,
      search: input.search,
      isActive: input.isActive,
      lowStock: input.lowStock,
    };

    const result = await this.productRepo.findAll(filter, {
      page: input.page,
      limit: input.limit,
    });

    return Result.ok({
      items: result.items.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        unitOfMeasure: p.unitOfMeasure,
        basePrice: p.basePrice,
        minimumStock: p.minimumStock,
        isActive: p.isActive,
      })),
      meta: result.meta,
    });
  }
}
