import { describe, beforeEach, it, expect } from '@jest/globals';
import { ListProductsUseCase } from '../ListProductsUseCase';
import { MockProductRepository } from '@inventory/tests/mocks/MockProductRepository';
import { Product } from '@inventory/domain/entities/Product';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let productRepo: MockProductRepository;

  beforeEach(() => {
    productRepo = new MockProductRepository();
    useCase = new ListProductsUseCase(productRepo);
  });

  describe('execute', () => {
    beforeEach(async () => {
      // Setup test data
      const product1 = Product.create({
        sku: 'SKU-001',
        name: 'Product 1',
        unitOfMeasure: 'PCS' as const,
        minimumStock: 10,
      }).getValue();

      const product2 = Product.create({
        sku: 'SKU-002',
        name: 'Product 2',
        unitOfMeasure: 'KG' as const,
        minimumStock: 5,
      }).getValue();

      product2.deactivate(); // inactive product

      const product3 = Product.create({
        sku: 'SKU-003',
        name: 'Active Product',
        unitOfMeasure: 'PCS' as const,
        minimumStock: 0,
      }).getValue();

      productRepo.setProducts([product1, product2, product3]);
    });

    it('should return success result with default pagination', async () => {
      // Arrange
      const input = { page: 1, limit: 10 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items, meta } = result.getValue();
      expect(items).toHaveLength(3);
      expect(meta.totalItems).toBe(3);
      expect(meta.totalPages).toBe(1);
    });

    it('should filter by isActive when provided', async () => {
      // Arrange
      const input = { page: 1, limit: 10, isActive: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items } = result.getValue();
      expect(items).toHaveLength(2); // Only active products
      expect(items.every((p: { isActive: boolean }) => p.isActive)).toBe(true);
    });

    it('should filter by isActive = false when provided', async () => {
      // Arrange
      const input = { page: 1, limit: 10, isActive: false };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items } = result.getValue();
      expect(items).toHaveLength(1); // Only inactive product
      expect(items[0].isActive).toBe(false);
    });

    it('should paginate correctly', async () => {
      // Arrange
      const input = { page: 1, limit: 2 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items, meta } = result.getValue();
      expect(items).toHaveLength(2);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(2);
      expect(meta.totalPages).toBe(2);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);
    });

    it('should handle page beyond total items', async () => {
      // Arrange
      const input = { page: 10, limit: 10 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items, meta } = result.getValue();
      expect(items).toHaveLength(0);
      expect(meta.page).toBe(10);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNextPage).toBe(false);
    });

    it('should search by name', async () => {
      // Arrange
      const input = { page: 1, limit: 10, search: 'Active' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items } = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0].name).toContain('Active');
    });

    it('should search by SKU', async () => {
      // Arrange
      const input = { page: 1, limit: 10, search: 'SKU-001' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items } = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0].sku).toBe('SKU-001');
    });

    it('should search by description', async () => {
      // Arrange
      const productWithDesc = Product.create({
        sku: 'SKU-DESC',
        name: 'Product',
        description: 'Searchable Description',
        unitOfMeasure: 'PCS' as const,
      }).getValue();
      productRepo.setProducts([...Array.from(productRepo['products'].values()), productWithDesc]);

      const input = { page: 1, limit: 10, search: 'Searchable' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items } = result.getValue();
      expect(items.length).toBeGreaterThan(0);
      const hasSearchable = items.some((p: { description: string | null }) => p.description?.includes('Searchable') ?? false);
      expect(hasSearchable).toBe(true);
    });

    it('should return empty array when no products match', async () => {
      // Arrange
      productRepo.clear();

      const input = { page: 1, limit: 10 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const { items, meta } = result.getValue();
      expect(items).toHaveLength(0);
      expect(meta.totalItems).toBe(0);
    });
  });
});
