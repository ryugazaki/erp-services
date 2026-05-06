import { describe, beforeEach, it, expect } from '@jest/globals';
import { CreateProductUseCase } from '../CreateProductUseCase';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Product } from '@inventory/domain/entities/Product';
import { Category } from '@inventory/domain/entities/Category';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepo: MockProductRepository;
  let categoryRepo: MockCategoryRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    categoryRepo = new MockCategoryRepository();
    eventBus = new MockEventBus();
    useCase = new CreateProductUseCase(productRepo, categoryRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when valid input provided without category', async () => {
      // Arrange
      const input = {
        sku: 'SKU-001',
        name: 'Test Product',
        unitOfMeasure: 'PCS' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual({
        id: expect.any(String),
        sku: 'SKU-001',
        name: 'Test Product',
        description: null,
        categoryId: null,
        unitOfMeasure: 'PCS' as const,
        basePrice: 0,
        minimumStock: 0,
        isActive: true,
      });
    });

    it('should return success result when valid input provided with category', async () => {
      // Arrange
      const categoryResult = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      });
      const category = categoryResult.getValue();
      categoryRepo.setCategories([category]);

      const input = {
        sku: 'SKU-002',
        name: 'Laptop',
        unitOfMeasure: 'PCS' as const,
        categoryId: category.id,
        basePrice: 15000000,
        minimumStock: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        sku: 'SKU-002',
        name: 'Laptop',
        categoryId: category.id,
        basePrice: 15000000,
        minimumStock: 10,
      });
    });

    it('should return failure result when SKU already exists', async () => {
      // Arrange
      const existingProduct = Product.create({
        sku: 'SKU-001',
        name: 'Existing Product',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      productRepo.setProducts([existingProduct]);

      const input = {
        sku: 'SKU-001',
        name: 'New Product',
        unitOfMeasure: 'PCS' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('SKU_ALREADY_EXISTS');
    });

    it('should return failure result when category not found', async () => {
      // Arrange
      const input = {
        sku: 'SKU-003',
        name: 'Test Product',
        unitOfMeasure: 'PCS' as const,
        categoryId: 'non-existent-id',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return failure result when product name is empty', async () => {
      // Arrange
      const input = {
        sku: 'SKU-004',
        name: '',
        unitOfMeasure: 'PCS' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PRODUCT_NAME_REQUIRED');
    });

    it('should publish ProductCreated event on success', async () => {
      // Arrange
      const input = {
        sku: 'SKU-005',
        name: 'New Product',
        unitOfMeasure: 'PCS' as const,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(eventBus.eventCount()).toBe(1);
      expect(eventBus.hasEvent('ProductCreated')).toBe(true);
    });

    it('should save product to repository on success', async () => {
      // Arrange
      const input = {
        sku: 'SKU-006',
        name: 'Saved Product',
        unitOfMeasure: 'PCS' as const,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(productRepo.count()).toBe(1);
      const saved = await productRepo.findBySKU('SKU-006');
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Saved Product');
    });

    it('should handle all valid units of measure', async () => {
      // Arrange
      const unitsOfMeasure = ['PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK'];

      for (const uom of unitsOfMeasure) {
        const input = {
          sku: `SKU-${uom}`,
          name: `Product ${uom}`,
          unitOfMeasure: uom as 'PCS' | 'KG' | 'GRAM' | 'LITER' | 'ML' | 'METER' | 'CM' | 'BOX' | 'PACK',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result.isSuccess()).toBe(true);
      }
    });

    it('should handle edge case: zero base price', async () => {
      // Arrange
      const input = {
        sku: 'SKU-007',
        name: 'Free Product',
        unitOfMeasure: 'PCS' as const,
        basePrice: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().basePrice).toBe(0);
    });

    it('should handle edge case: zero minimum stock', async () => {
      // Arrange
      const input = {
        sku: 'SKU-008',
        name: 'No Stock Product',
        unitOfMeasure: 'PCS' as const,
        minimumStock: 0,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().minimumStock).toBe(0);
    });
  });
});
