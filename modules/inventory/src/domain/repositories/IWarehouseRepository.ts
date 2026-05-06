import { Warehouse } from '../entities/Warehouse';

export interface IWarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  findAll(): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<void>;
  update(warehouse: Warehouse): Promise<void>;
}
