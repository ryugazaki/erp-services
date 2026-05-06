import { describe, beforeEach, it, expect } from '@jest/globals';
import { ListStockMovementsUseCase } from '../ListStockMovementsUseCase';
import { MockStockMovementRepository } from '@inventory/tests/mocks/MockStockMovementRepository';
import { StockMovement } from '@inventory/domain/entities/StockMovement';

describe('ListStockMovementsUseCase', () => {
  let useCase: ListStockMovementsUseCase;
  let stockMovementRepo: MockStockMovementRepository;

  beforeEach(() => {
    stockMovementRepo = new MockStockMovementRepository();
    useCase = new ListStockMovementsUseCase(stockMovementRepo);
  });

  describe('execute', () => {
    it('should return success result with paginated stock movements', async () => {
      // Arrange
      const movement1 = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      }).getValue();
      movement1.pullEvents();

      const movement2 = StockMovement.create({
        productId: 'product-002',
        warehouseId: 'warehouse-001',
        movementType: 'OUT',
        quantity: 50,
      }).getValue();
      movement2.pullEvents();

      stockMovementRepo.setMovements([movement1, movement2]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10 });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(2);
      expect(result.getValue().meta).toMatchObject({
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should return success result with empty array when no movements exist', async () => {
      // Arrange
      stockMovementRepo.setMovements([]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10 });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(0);
      expect(result.getValue().meta.totalItems).toBe(0);
    });

    it('should return success result with pagination for page 2', async () => {
      // Arrange
      const movements: StockMovement[] = [];
      for (let i = 0; i < 15; i++) {
        const movement = StockMovement.create({
          productId: `product-${i}`,
          warehouseId: 'warehouse-001',
          movementType: 'IN',
          quantity: 10,
        }).getValue();
        movement.pullEvents();
        movements.push(movement);
      }
      stockMovementRepo.setMovements(movements);

      // Act
      const result = await useCase.execute({ page: 2, limit: 10 });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(5);
      expect(result.getValue().meta).toMatchObject({
        page: 2,
        limit: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should return success result filtered by productId', async () => {
      // Arrange
      const movement1 = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      }).getValue();
      movement1.pullEvents();

      const movement2 = StockMovement.create({
        productId: 'product-002',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 50,
      }).getValue();
      movement2.pullEvents();

      stockMovementRepo.setMovements([movement1, movement2]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10, productId: 'product-001' });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        productId: 'product-001',
      });
    });

    it('should return success result filtered by warehouseId', async () => {
      // Arrange
      const movement1 = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      }).getValue();
      movement1.pullEvents();

      const movement2 = StockMovement.create({
        productId: 'product-002',
        warehouseId: 'warehouse-002',
        movementType: 'IN',
        quantity: 50,
      }).getValue();
      movement2.pullEvents();

      stockMovementRepo.setMovements([movement1, movement2]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10, warehouseId: 'warehouse-001' });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        warehouseId: 'warehouse-001',
      });
    });

    it('should return success result filtered by movementType', async () => {
      // Arrange
      const movement1 = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
      }).getValue();
      movement1.pullEvents();

      const movement2 = StockMovement.create({
        productId: 'product-002',
        warehouseId: 'warehouse-001',
        movementType: 'OUT',
        quantity: 50,
      }).getValue();
      movement2.pullEvents();

      stockMovementRepo.setMovements([movement1, movement2]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10, movementType: 'IN' });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        movementType: 'IN',
      });
    });

    it('should return success result filtered by referenceType', async () => {
      // Arrange
      const movement1 = StockMovement.create({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
      }).getValue();
      movement1.pullEvents();

      const movement2 = StockMovement.create({
        productId: 'product-002',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 50,
        referenceType: 'SALES_ORDER',
        referenceId: 'SO-001',
      }).getValue();
      movement2.pullEvents();

      stockMovementRepo.setMovements([movement1, movement2]);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10, referenceType: 'PURCHASE_ORDER' });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        referenceType: 'PURCHASE_ORDER',
      });
    });

    it('should return success result with movements including all fields', async () => {
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
      const result = await useCase.execute({ page: 1, limit: 10 });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items[0]).toMatchObject({
        productId: 'product-001',
        warehouseId: 'warehouse-001',
        movementType: 'IN',
        quantity: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        notes: 'Initial stock',
      });
    });
  });
});
