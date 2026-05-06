import { describe, beforeEach, it, expect } from '@jest/globals';
import { CreateStockMovementUseCase } from '../CreateStockMovementUseCase';
import { MockStockMovementRepository } from '@inventory/tests/mocks/MockStockMovementRepository';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { MockWarehouseRepository } from '@inventory/tests/mocks/MockWarehouseRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Product } from '@inventory/domain/entities/Product';
import { Warehouse } from '@inventory/domain/entities/Warehouse';

describe('CreateStockMovementUseCase', () => {
  let useCase: CreateStockMovementUseCase;
  let stockMovementRepo: MockStockMovementRepository;
  let productRepo: MockProductRepository;
  let warehouseRepo: MockWarehouseRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    stockMovementRepo = new MockStockMovementRepository();
    productRepo = new MockProductRepository();
    warehouseRepo = new MockWarehouseRepository();
    eventBus = new MockEventBus();
    useCase = new CreateStockMovementUseCase(
      stockMovementRepo,
      productRepo,
      warehouseRepo,
      eventBus,
    );
  });

  describe('execute', () => {
    it('should return success result when valid input provided for IN movement', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN',
        quantity: 100,
      });
    });

    it('should return success result when valid input provided for OUT movement', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'OUT' as const,
        quantity: 50,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        movementType: 'OUT',
        quantity: 50,
      });
    });

    it('should return success result when valid input provided for TRANSFER movement', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'TRANSFER' as const,
        quantity: 25,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().movementType).toBe('TRANSFER');
    });

    it('should return success result when valid input provided for ADJUSTMENT movement', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'ADJUSTMENT' as const,
        quantity: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().movementType).toBe('ADJUSTMENT');
    });

    it('should return success result with optional fields', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        notes: 'Initial stock',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        notes: 'Initial stock',
      });
    });

    it('should return failure result when product not found', async () => {
      // Arrange
      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: 'non-existent-product-id',
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return failure result when product is not active', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      product.deactivate();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NOT_ACTIVE');
    });

    it('should return failure result when warehouse not found', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const input = {
        productId: product.id,
        warehouseId: 'non-existent-warehouse-id',
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NOT_FOUND');
    });

    it('should return failure result when warehouse is not active', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouse.deactivate();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('WAREHOUSE_NOT_ACTIVE');
    });

    it('should return failure result when quantity is zero', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('QUANTITY_REQUIRED');
    });

    it('should return failure result when quantity is negative', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: -10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_QUANTITY');
    });

    it('should publish StockMovementCreated event on success', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(eventBus.eventCount()).toBe(1);
      expect(eventBus.hasEvent('StockMovementCreated')).toBe(true);
    });

    it('should save stock movement to repository on success', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS',
      }).getValue();
      product.pullEvents();
      productRepo.setProducts([product]);

      const warehouse = Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-001',
      }).getValue();
      warehouse.pullEvents();
      warehouseRepo.setWarehouses([warehouse]);

      const input = {
        productId: product.id,
        warehouseId: warehouse.id,
        movementType: 'IN' as const,
        quantity: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      const saved = await stockMovementRepo.findById(result.getValue().id);
      expect(saved).not.toBeNull();
      expect(saved?.quantity).toBe(100);
    });
  });
});
