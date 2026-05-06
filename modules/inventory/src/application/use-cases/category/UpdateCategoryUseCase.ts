import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IEventBus } from '@erp/core/event-bus';
import { UpdateCategoryDTO } from '../../dtos/category/UpdateCategoryDTO';

export interface UpdateCategoryInput extends UpdateCategoryDTO {
  id: string;
}

export interface UpdateCategoryResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
}

@injectable()
export class UpdateCategoryUseCase implements IUseCase<UpdateCategoryInput, Result<UpdateCategoryResult>> {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Result<UpdateCategoryResult>> {
    const category = await this.categoryRepo.findById(input.id);
    if (!category) return Result.fail('CATEGORY_NOT_FOUND');

    if (input.parentId) {
      if (input.parentId === input.id) return Result.fail('CANNOT_BE_SELF_PARENT');

      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) return Result.fail('PARENT_CATEGORY_NOT_FOUND');
    }

    const result = category.updateDetails({
      name: input.name,
      description: input.description ?? undefined,
      parentId: input.parentId ?? undefined,
    });

    if (result.isFailure()) return Result.fail(result.getError());

    await this.categoryRepo.update(category);

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
