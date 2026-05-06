import { describe, beforeEach, it, expect } from '@jest/globals';
import { DeleteProductUseCase } from '../DeleteProductUseCase';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Product } from '@inventory/domain/entities/Product';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let productRepo: MockProductRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    eventBus = new MockEventBus();
    useCase = new DeleteProductUseCase(productRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result and deactivate product', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Active Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: product.id,
        isActive: false,
      });
    });

    it('should return failure result when product not found', async () => {
      // Arrange
      const input = { id: 'non-existent-id' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return failure result when product already inactive', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-002',
        name: 'Inactive Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.deactivate();
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_ALREADY_INACTIVE');
    });

    it('should publish ProductDeleted event on success', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-003',
        name: 'To Delete',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      await useCase.execute(input);

      // Assert
      expect(eventBus.eventCount()).toBe(1);
      expect(eventBus.hasEvent('ProductDeleted')).toBe(true);
    });

    it('should update product in repository', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-004',
        name: 'To Delete',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      await useCase.execute(input);

      // Assert
      const updated = await productRepo.findById(product.id);
      expect(updated?.isActive).toBe(false);
    });

    it('should handle deletion of product with category', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-005',
        name: 'Categorized Product',
        categoryId: 'category-123',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().isActive).toBe(false);
    });
  });
});
