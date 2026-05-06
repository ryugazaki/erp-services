import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';
import { IEventBus } from '@erp/core/event-bus';
import { UpdateWarehouseDTO } from '../../dtos/warehouse/UpdateWarehouseDTO';

export interface UpdateWarehouseInput extends UpdateWarehouseDTO {
  id: string;
}

export interface UpdateWarehouseResult {
  id: string;
  name: string;
  code: string;
  address: string | null;
  locationId: string | null;
  isActive: boolean;
}

@injectable()
export class UpdateWarehouseUseCase implements IUseCase<UpdateWarehouseInput, Result<UpdateWarehouseResult>> {
  constructor(
    private readonly warehouseRepo: IWarehouseRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateWarehouseInput): Promise<Result<UpdateWarehouseResult>> {
    const warehouse = await this.warehouseRepo.findById(input.id);
    if (!warehouse) return Result.fail('WAREHOUSE_NOT_FOUND');

    const result = warehouse.updateDetails({
      name: input.name,
      address: input.address ?? undefined,
      locationId: input.locationId ?? undefined,
    });

    if (result.isFailure()) return Result.fail(result.getError());

    await this.warehouseRepo.update(warehouse);

    for (const event of warehouse.pullEvents()) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      locationId: warehouse.locationId,
      isActive: warehouse.isActive,
    });
  }
}
