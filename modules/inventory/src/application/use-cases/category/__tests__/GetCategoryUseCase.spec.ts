import { describe, beforeEach, it, expect } from '@jest/globals';
import { GetCategoryUseCase } from '../GetCategoryUseCase';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { Category } from '@inventory/domain/entities/Category';

describe('GetCategoryUseCase', () => {
  let useCase: GetCategoryUseCase;
  let categoryRepo: MockCategoryRepository;

  beforeEach(() => {
    categoryRepo = new MockCategoryRepository();
    useCase = new GetCategoryUseCase(categoryRepo);
  });

  describe('execute', () => {
    it('should return success result when category exists', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({ id: category.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: category.id,
        name: 'Electronics',
        code: 'ELEC',
        isActive: true,
      });
    });

    it('should return success result with all fields including description and parent', async () => {
      // Arrange
      const parentCategory = Category.create({
        name: 'Products',
        code: 'PROD',
      }).getValue();
      parentCategory.pullEvents();
      categoryRepo.setCategories([parentCategory]);

      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
        description: 'Electronic products',
        parentId: parentCategory.id,
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([parentCategory, category]);

      // Act
      const result = await useCase.execute({ id: category.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: category.id,
        name: 'Electronics',
        code: 'ELEC',
        description: 'Electronic products',
        parentId: parentCategory.id,
        isActive: true,
      });
    });

    it('should return success result for inactive category', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      category.deactivate();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({ id: category.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().isActive).toBe(false);
    });

    it('should return failure result when category not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await useCase.execute({ id: nonExistentId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return failure result when id is empty', async () => {
      // Arrange
      const emptyId = '';

      // Act
      const result = await useCase.execute({ id: emptyId });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NOT_FOUND');
    });
  });
});
