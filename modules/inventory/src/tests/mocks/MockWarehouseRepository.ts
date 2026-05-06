import { IWarehouseRepository } from '@inventory/domain/repositories/IWarehouseRepository';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

export class MockWarehouseRepository implements IWarehouseRepository {
  private warehouses: Map<string, Warehouse> = new Map();

  async findById(id: string): Promise<Warehouse | null> {
    return this.warehouses.get(id) || null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    for (const warehouse of this.warehouses.values()) {
      if (warehouse.code === code) return warehouse;
    }
    return null;
  }

  async findAll(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async save(warehouse: Warehouse): Promise<void> {
    this.warehouses.set(warehouse.id, warehouse);
  }

  async update(warehouse: Warehouse): Promise<void> {
    this.warehouses.set(warehouse.id, warehouse);
  }

  // Helper methods for testing
  setWarehouses(warehouses: Warehouse[]): void {
    this.warehouses.clear();
    for (const warehouse of warehouses) {
      this.warehouses.set(warehouse.id, warehouse);
    }
  }

  clear(): void {
    this.warehouses.clear();
  }

  count(): number {
    return this.warehouses.size;
  }
}
