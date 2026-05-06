import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';
import { Warehouse } from '../../../domain/entities/Warehouse';
import { IEventBus } from '@erp/core/event-bus';
import { CreateWarehouseDTO } from '../../dtos/warehouse/CreateWarehouseDTO';

export interface CreateWarehouseInput extends CreateWarehouseDTO {}

export interface CreateWarehouseResult {
  id: string;
  name: string;
  code: string;
  address: string | null;
  locationId: string | null;
  isActive: boolean;
}

@injectable()
export class CreateWarehouseUseCase implements IUseCase<CreateWarehouseInput, Result<CreateWarehouseResult>> {
  constructor(
    private readonly warehouseRepo: IWarehouseRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateWarehouseInput): Promise<Result<CreateWarehouseResult>> {
    const existingWarehouse = await this.warehouseRepo.findByCode(input.code);
    if (existingWarehouse) return Result.fail('WAREHOUSE_CODE_ALREADY_EXISTS');

    const warehouseResult = Warehouse.create({
      name: input.name,
      code: input.code,
      address: input.address,
      locationId: input.locationId,
    });

    if (warehouseResult.isFailure()) return Result.fail(warehouseResult.getError());

    const warehouse = warehouseResult.getValue();
    await this.warehouseRepo.save(warehouse);

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
