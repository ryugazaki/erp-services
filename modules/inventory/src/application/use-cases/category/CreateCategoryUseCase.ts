import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { Category } from '../../../domain/entities/Category';
import { IEventBus } from '@erp/core/event-bus';
import { CreateCategoryDTO } from '../../dtos/category/CreateCategoryDTO';

export interface CreateCategoryInput extends CreateCategoryDTO {}

export interface CreateCategoryResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
}

@injectable()
export class CreateCategoryUseCase implements IUseCase<CreateCategoryInput, Result<CreateCategoryResult>> {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Result<CreateCategoryResult>> {
    const existingCategory = await this.categoryRepo.findByCode(input.code);
    if (existingCategory) return Result.fail('CATEGORY_CODE_ALREADY_EXISTS');

    if (input.parentId) {
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) return Result.fail('PARENT_CATEGORY_NOT_FOUND');
    }

    const categoryResult = Category.create({
      name: input.name,
      code: input.code,
      description: input.description,
      parentId: input.parentId,
    });

    if (categoryResult.isFailure()) return Result.fail(categoryResult.getError());

    const category = categoryResult.getValue();
    await this.categoryRepo.save(category);

    for (const event of category.pullEvents()) {
      await this.eventBus.publish(event);
    }

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
