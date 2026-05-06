import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

export interface GetCategoryInput {
  id: string;
}

export interface GetCategoryResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
}

@injectable()
export class GetCategoryUseCase implements IUseCase<GetCategoryInput, Result<GetCategoryResult>> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: GetCategoryInput): Promise<Result<GetCategoryResult>> {
    const category = await this.categoryRepo.findById(input.id);
    if (!category) return Result.fail('CATEGORY_NOT_FOUND');

    return Result.ok({
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
    });
  }
}
