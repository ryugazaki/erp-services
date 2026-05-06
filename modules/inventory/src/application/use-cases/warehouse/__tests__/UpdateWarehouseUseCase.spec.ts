import { describe, beforeEach, it, expect } from '@jest/globals';
import { UpdateWarehouseUseCase } from '../UpdateWarehouseUseCase';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('UpdateWarehouseUseCase', () => {
  let useCase: UpdateWarehouseUseCase;
  let warehouseRepo: MockWarehouseRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    warehouseRepo = new MockWarehouseRepository();
    eventBus = new MockEventBus();
    useCase = new UpdateWarehouseUseCase(warehouseRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when updating name', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        name: 'Updated Warehouse',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: warehouse.id,
        name: 'Updated Warehouse',
        code: 'WH-001',
      });
    });

    it('should return success result when updating multiple fields', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        name: 'Updated Warehouse',
        address: '456 New Address',
        locationId: 'loc-002',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: warehouse.id,
        name: 'Updated Warehouse',
        address: '456 New Address',
        locationId: 'loc-002',
      });
    });

    it('should return success result when updating address only', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        address: '123 Main St, Jakarta',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().address).toBe('123 Main St, Jakarta');
    });

    it('should return success result when updating locationId only', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        locationId: 'loc-001',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().locationId).toBe('loc-001');
    });

    it('should return success result when removing address with empty string', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        address: '', // Empty string to remove address
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().address).toBeNull();
    });

    it('should return success result when removing locationId with empty string', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
        locationId: 'loc-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        locationId: '', // Empty string to remove locationId
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().locationId).toBeNull();
    });

    it('should return failure result when warehouse not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await useCase.execute({
        id: nonExistentId,
        name: 'Updated Name',
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NOT_FOUND');
    });

    it('should return failure result when name is empty', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      // Act
      const result = await useCase.execute({
        id: warehouse.id,
        name: '',
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NAME_REQUIRED');
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
      await useCase.execute({
        id: warehouse.id,
        name: 'Updated Warehouse',
      });

      // Assert
      const updated = await warehouseRepo.findById(warehouse.id);
      expect(updated?.name).toBe('Updated Warehouse');
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
      await useCase.execute({
        id: warehouse.id,
        name: 'Updated Warehouse',
      });

      // Assert
      const updated = await warehouseRepo.findById(warehouse.id);
      expect(updated?.name).toBe('Updated Warehouse');
    });
  });
});
