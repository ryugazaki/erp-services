import { describe, beforeEach, it, expect } from '@jest/globals';
import { UpdateProductUseCase } from '../UpdateProductUseCase';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Product } from '@inventory/domain/entities/Product';
import { Category } from '@inventory/domain/entities/Category';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let productRepo: MockProductRepository;
  let categoryRepo: MockCategoryRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    categoryRepo = new MockCategoryRepository();
    eventBus = new MockEventBus();
    useCase = new UpdateProductUseCase(productRepo, categoryRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when updating name', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-001',
        name: 'Original Name',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        name: 'Updated Name',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().name).toBe('Updated Name');
    });

    it('should return failure result when product not found', async () => {
      // Arrange
      const input = {
        id: 'non-existent-id',
        name: 'Updated Name',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return failure result when category not found', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-002',
        name: 'Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        categoryId: 'non-existent-category',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return failure result when name is empty', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-003',
        name: 'Original',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        name: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NAME_REQUIRED');
    });

    it('should return failure result when base price is negative', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-004',
        name: 'Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        basePrice: -100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_BASE_PRICE');
    });

    it('should return failure result when minimum stock is negative', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-005',
        name: 'Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        minimumStock: -1,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_MINIMUM_STOCK');
    });

    it('should publish ProductUpdated event on success', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-006',
        name: 'Original',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        name: 'Updated',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(eventBus.eventCount()).toBe(1);
      expect(eventBus.hasEvent('ProductUpdated')).toBe(true);
    });

    it('should update product in repository', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-007',
        name: 'Original',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        name: 'Updated',
        basePrice: 100000,
      };

      // Act
      await useCase.execute(input);

      // Assert
      const updated = await productRepo.findById(product.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.basePrice).toBe(100000);
    });

    it('should allow removing category', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      categoryRepo.setCategories([category]);

      const product = Product.create({
        sku: 'SKU-008',
        name: 'Product',
        unitOfMeasure: 'PCS' as const,
        categoryId: category.id,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        categoryId: null,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().categoryId).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const product = Product.create({
        sku: 'SKU-009',
        name: 'Multi Field Product',
        description: 'Original',
        unitOfMeasure: 'PCS' as const,
        basePrice: 100,
        minimumStock: 10,
      }).getValue();
      product.pullEvents(); // Clear ProductCreated event
      productRepo.setProducts([product]);

      const input = {
        id: product.id,
        name: 'Updated Name',
        description: 'Updated Description',
        basePrice: 200,
        minimumStock: 20,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const updated = result.getValue();
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
      expect(updated.basePrice).toBe(200);
      expect(updated.minimumStock).toBe(20);
    });
  });
});
