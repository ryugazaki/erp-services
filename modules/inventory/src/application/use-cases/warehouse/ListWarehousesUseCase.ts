import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';
import { ListWarehousesDTO } from '../../dtos/warehouse/ListWarehousesDTO';

export interface ListWarehousesInput extends ListWarehousesDTO {}

export interface ListWarehousesResult {
  items: Array<{
    id: string;
    name: string;
    code: string;
    address: string | null;
    locationId: string | null;
    isActive: boolean;
  }>;
}

@injectable()
export class ListWarehousesUseCase implements IUseCase<ListWarehousesInput, Result<ListWarehousesResult>> {
  constructor(private readonly warehouseRepo: IWarehouseRepository) {}

  async execute(input: ListWarehousesInput): Promise<Result<ListWarehousesResult>> {
    const warehouses = await this.warehouseRepo.findAll();

    const filtered = input.isActive !== undefined
      ? warehouses.filter((w) => w.isActive === input.isActive)
      : warehouses;

    return Result.ok({
      items: filtered.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        address: w.address,
        locationId: w.locationId,
        isActive: w.isActive,
      })),
    });
  }
}
