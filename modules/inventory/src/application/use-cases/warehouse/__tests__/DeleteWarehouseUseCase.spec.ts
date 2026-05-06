import { describe, beforeEach, it, expect } from '@jest/globals';
import { DeleteWarehouseUseCase } from '../DeleteWarehouseUseCase';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('DeleteWarehouseUseCase', () => {
  let useCase: DeleteWarehouseUseCase;
  let warehouseRepo: MockWarehouseRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    warehouseRepo = new MockWarehouseRepository();
    eventBus = new MockEventBus();
    useCase = new DeleteWarehouseUseCase(warehouseRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when deactivating active warehouse', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({ id: warehouse.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: warehouse.id,
        name: 'Main Warehouse',
        isActive: false,
      });
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

    it('should return failure result when warehouse is already inactive', async () => {
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
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_ALREADY_INACTIVE');
    });

    it('should update warehouse in repository on success', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      await useCase.execute({ id: warehouse.id });

      // Assert
      const updated = await warehouseRepo.findById(warehouse.id);
      expect(updated?.isActive).toBe(false);
    });

    it('should update warehouse in repository on success', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      await useCase.execute({ id: warehouse.id });

      // Assert
      const updated = await warehouseRepo.findById(warehouse.id);
      expect(updated?.isActive).toBe(false);
    });
  });
});
