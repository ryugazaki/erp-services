import { describe, beforeEach, it, expect } from '@jest/globals';
import { ListWarehousesUseCase } from '../ListWarehousesUseCase';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('ListWarehousesUseCase', () => {
  let useCase: ListWarehousesUseCase;
  let warehouseRepo: MockWarehouseRepository;

  beforeEach(() => {
    warehouseRepo = new MockWarehouseRepository();
    useCase = new ListWarehousesUseCase(warehouseRepo);
  });

  describe('execute', () => {
    it('should return success result with all warehouses', async () => {
      // Arrange
      const warehouse1 = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse1.pullEvents();

      const warehouse2 = Warehouse.create({
        name: 'Secondary Warehouse',
        code: 'WH-002',
      }).getValue();
      warehouse2.pullEvents();

      warehouseRepo.setWarehouses([warehouse1, warehouse2]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(2);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Main Warehouse',
        code: 'WH-001',
      });
      expect(result.getValue().items[1]).toMatchObject({
        name: 'Secondary Warehouse',
        code: 'WH-002',
      });
    });

    it('should return success result with empty array when no warehouses exist', async () => {
      // Arrange
      warehouseRepo.setWarehouses([]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(0);
    });

    it('should return success result filtered by active status when isActive is true', async () => {
      // Arrange
      const activeWarehouse = Warehouse.create({
        name: 'Active Warehouse',
        code: 'WH-001',
      }).getValue();
      activeWarehouse.pullEvents();

      const inactiveWarehouse = Warehouse.create({
        name: 'Inactive Warehouse',
        code: 'WH-002',
      }).getValue();
      inactiveWarehouse.pullEvents();
      inactiveWarehouse.deactivate();
      inactiveWarehouse.pullEvents();

      warehouseRepo.setWarehouses([activeWarehouse, inactiveWarehouse]);

      // Act
      const result = await useCase.execute({ isActive: true });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Active Warehouse',
        isActive: true,
      });
    });

    it('should return success result filtered by active status when isActive is false', async () => {
      // Arrange
      const activeWarehouse = Warehouse.create({
        name: 'Active Warehouse',
        code: 'WH-001',
      }).getValue();
      activeWarehouse.pullEvents();

      const inactiveWarehouse = Warehouse.create({
        name: 'Inactive Warehouse',
        code: 'WH-002',
      }).getValue();
      inactiveWarehouse.pullEvents();
      inactiveWarehouse.deactivate();
      inactiveWarehouse.pullEvents();

      warehouseRepo.setWarehouses([activeWarehouse, inactiveWarehouse]);

      // Act
      const result = await useCase.execute({ isActive: false });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Inactive Warehouse',
        isActive: false,
      });
    });

    it('should return success result with warehouses including address', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Main Warehouse',
        address: '123 Main St, Jakarta',
      });
    });

    it('should return success result with warehouses including locationId', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
        locationId: 'loc-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Main Warehouse',
        locationId: 'loc-001',
      });
    });
  });
});
