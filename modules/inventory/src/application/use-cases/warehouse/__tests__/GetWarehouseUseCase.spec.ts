import { describe, beforeEach, it, expect } from '@jest/globals';
import { GetWarehouseUseCase } from '../GetWarehouseUseCase';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('GetWarehouseUseCase', () => {
  let useCase: GetWarehouseUseCase;
  let warehouseRepo: MockWarehouseRepository;

  beforeEach(() => {
    warehouseRepo = new MockWarehouseRepository();
    useCase = new GetWarehouseUseCase(warehouseRepo);
  });

  describe('execute', () => {
    it('should return success result when warehouse exists', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({ id: warehouse.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: warehouse.id,
        name: 'Main Warehouse',
        code: 'WH-001',
        isActive: true,
      });
    });

    it('should return success result with all fields including address and location', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
        locationId: 'loc-001',
      }).getValue();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({ id: warehouse.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: warehouse.id,
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
        locationId: 'loc-001',
        isActive: true,
      });
    });

    it('should return success result for inactive warehouse', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouse.deactivate();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({ id: warehouse.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().isActive).toBe(false);
    });

    it('should return failure result when warehouse not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await useCase.execute({ id: nonExistentId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NOT_FOUND');
    });

    it('should return failure result when id is empty', async () => {
      // Arrange
      const emptyId = '';

      // Act
      const result = await useCase.execute({ id: emptyId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NOT_FOUND');
    });
  });
});
