import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IEventBus } from '@erp/core/event-bus';

export interface DeleteCategoryInput {
  id: string;
}

export interface DeleteCategoryResult {
  id: string;
  name: string;
  isActive: boolean;
}

@injectable()
export class DeleteCategoryUseCase implements IUseCase<DeleteCategoryInput, Result<DeleteCategoryResult>> {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<Result<DeleteCategoryResult>> {
    const category = await this.categoryRepo.findById(input.id);
    if (!category) return Result.fail('CATEGORY_NOT_FOUND');

    const result = category.deactivate();
    if (result.isFailure()) return Result.fail(result.getError());

    await this.categoryRepo.update(category);

    for (const event of category.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    });
  }
}
