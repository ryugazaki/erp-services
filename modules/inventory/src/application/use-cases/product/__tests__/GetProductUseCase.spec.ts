import { describe, beforeEach, it, expect } from '@jest/globals';
import { GetProductUseCase } from '../GetProductUseCase';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { Product } from '@inventory/domain/entities/Product';

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase;
  let productRepo: MockProductRepository;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    useCase = new GetProductUseCase(productRepo);
  });

  describe('execute', () => {
    it('should return success result when product exists', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Test Product',
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
        sku: 'SKU-001',
        name: 'Test Product',
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

    it('should return all product fields', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-002',
        name: 'Complete Product',
        description: 'Full description',
        unitOfMeasure: 'KG' as const,
        basePrice: 50000,
        minimumStock: 100,
      }).getValue();
      productRepo.setProducts([product]);

      const input = { id: product.id };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual({
        id: product.id,
        sku: 'SKU-002',
        name: 'Complete Product',
        description: 'Full description',
        categoryId: null,
        unitOfMeasure: 'KG' as const,
        basePrice: 50000,
        minimumStock: 100,
        isActive: true,
      });
    });

    it('should handle product with category', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-003',
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
      expect(result.getValue().categoryId).toBe('category-123');
    });

    it('should handle inactive product', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-004',
        name: 'Inactive Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.deactivate();
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
