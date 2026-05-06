import { describe, beforeEach, it, expect } from '@jest/globals';
import { CreateWarehouseUseCase } from '../CreateWarehouseUseCase';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('CreateWarehouseUseCase', () => {
  let useCase: CreateWarehouseUseCase;
  let warehouseRepo: MockWarehouseRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    warehouseRepo = new MockWarehouseRepository();
    eventBus = new MockEventBus();
    useCase = new CreateWarehouseUseCase(warehouseRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when valid input provided', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        name: 'Main Warehouse',
        code: 'WH-001',
        isActive: true,
      });
    });

    it('should return success result when valid input provided with address', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().address).toBe('123 Main St, Jakarta');
    });

    it('should return success result when valid input provided with locationId', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
        locationId: 'loc-001',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().locationId).toBe('loc-001');
    });

    it('should return success result when valid input provided with all optional fields', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
        locationId: 'loc-001',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Main St, Jakarta',
        locationId: 'loc-001',
      });
    });

    it('should return failure result when code already exists', async () => {
      // Arrange
      const existingWarehouse = Warehouse.create({
        name: 'Existing Warehouse',
        code: 'WH-001',
      }).getValue();
      existingWarehouse.pullEvents();
      warehouseRepo.setWarehouses([existingWarehouse]);

      const input = {
        name: 'New Warehouse',
        code: 'WH-001',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_CODE_ALREADY_EXISTS');
    });

    it('should return failure result when name is empty', async () => {
      // Arrange
      const input = {
        name: '',
        code: 'WH-001',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NAME_REQUIRED');
    });

    it('should return failure result when code is empty', async () => {
      // Arrange
      const input = {
        name: 'Test Warehouse',
        code: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_CODE_REQUIRED');
    });

    it('should save warehouse to repository on success', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(warehouseRepo.count()).toBe(1);
      const saved = await warehouseRepo.findByCode('WH-001');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Main Warehouse');
    });

    it('should save warehouse to repository on success', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(warehouseRepo.count()).toBe(1);
      const saved = await warehouseRepo.findByCode('WH-001');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Main Warehouse');
    });

    it('should handle edge case: undefined address', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
        address: undefined,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().address).toBeNull();
    });

    it('should handle edge case: undefined locationId', async () => {
      // Arrange
      const input = {
        name: 'Main Warehouse',
        code: 'WH-001',
        locationId: undefined,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().locationId).toBeNull();
    });
  });
});
