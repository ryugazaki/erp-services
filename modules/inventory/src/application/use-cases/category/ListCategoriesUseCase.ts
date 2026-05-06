import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { ListCategoriesDTO } from '../../dtos/category/ListCategoriesDTO';

export interface ListCategoriesInput extends ListCategoriesDTO {}

export interface ListCategoriesResult {
  items: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
  }>;
}

@injectable()
export class ListCategoriesUseCase implements IUseCase<ListCategoriesInput, Result<ListCategoriesResult>> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<Result<ListCategoriesResult>> {
    const categories = await this.categoryRepo.findAll();

    const filtered = input.isActive !== undefined
      ? categories.filter((c) => c.isActive === input.isActive)
      : categories;

    return Result.ok({
      items: filtered.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description,
        parentId: c.parentId,
        isActive: c.isActive,
      })),
    });
  }
}
