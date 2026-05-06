import { describe, beforeEach, it, expect } from '@jest/globals';
import { GetStockMovementUseCase } from '../GetStockMovementUseCase';
import { MockStockMovementRepository } from '@inventory/tests/mocks/MockStockMovementRepository';
import { StockMovement } from '@inventory/domain/entities/StockMovement';

describe('GetStockMovementUseCase', () => {
  let useCase: GetStockMovementUseCase;
  let stockMovementRepo: MockStockMovementRepository;

  beforeEach(() => {
    stockMovementRepo = new MockStockMovementRepository();
    useCase = new GetStockMovementUseCase(stockMovementRepo);
  });

  describe('execute', () => {
    it('should return success result when stock movement exists', async () => {
      // Arrange
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: movement.id,
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      });
    });

    it('should return success result with all fields including references and notes', async () => {
      // Arrange
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        notes: 'Initial stock',
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: movement.id,
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        notes: 'Initial stock',
      });
    });

    it('should return success result with occurredAt date', async () => {
      // Arrange
      const occurredAt = new Date('2024-01-01T10:00:00Z');
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
        occurredAt,
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().occurredAt).toEqual(occurredAt);
    });

    it('should return success result for OUT movement type', async () => {
      // Arrange
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'OUT',
        quantity: 50,
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().movementType).toBe('OUT');
    });

    it('should return success result for TRANSFER movement type', async () => {
      // Arrange
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'TRANSFER',
        quantity: 25,
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().movementType).toBe('TRANSFER');
    });

    it('should return success result for ADJUSTMENT movement type', async () => {
      // Arrange
      const movement = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'ADJUSTMENT',
        quantity: 10,
      }).getValue();
      movement.pullEvents();
      stockMovementRepo.setMovements([movement]);

      // Act
      const result = await useCase.execute({ id: movement.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().movementType).toBe('ADJUSTMENT');
    });

    it('should return failure result when stock movement not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await useCase.execute({ id: nonExistentId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('STOCK_MOVEMENT_NOT_FOUND');
    });

    it('should return failure result when id is empty', async () => {
      // Arrange
      const emptyId = '';

      // Act
      const result = await useCase.execute({ id: emptyId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('STOCK_MOVEMENT_NOT_FOUND');
    });
  });
});
