import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';
import { IEventBus } from '@erp/core/event-bus';

export interface DeleteWarehouseInput {
  id: string;
}

export interface DeleteWarehouseResult {
  id: string;
  name: string;
  isActive: boolean;
}

@injectable()
export class DeleteWarehouseUseCase implements IUseCase<DeleteWarehouseInput, Result<DeleteWarehouseResult>> {
  constructor(
    private readonly warehouseRepo: IWarehouseRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: DeleteWarehouseInput): Promise<Result<DeleteWarehouseResult>> {
    const warehouse = await this.warehouseRepo.findById(input.id);
    if (!warehouse) return Result.fail('WAREHOUSE_NOT_FOUND');

    const result = warehouse.deactivate();
    if (result.isFailure()) return Result.fail(result.getError());

    await this.warehouseRepo.update(warehouse);

    for (const event of warehouse.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: warehouse.id,
      name: warehouse.name,
      isActive: warehouse.isActive,
    });
  }
}
