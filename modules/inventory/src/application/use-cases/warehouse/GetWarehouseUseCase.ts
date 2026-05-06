import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';

export interface GetWarehouseInput {
  id: string;
}

export interface GetWarehouseResult {
  id: string;
  name: string;
  code: string;
  address: string | null;
  locationId: string | null;
  isActive: boolean;
}

@injectable()
export class GetWarehouseUseCase implements IUseCase<GetWarehouseInput, Result<GetWarehouseResult>> {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(input: GetWarehouseInput): Promise<Result<GetWarehouseResult>> {
    const warehouse = await this.warehouseRepo.findById(input.id);
    if (!warehouse) return Result.fail('WAREHOUSE_NOT_FOUND');

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
