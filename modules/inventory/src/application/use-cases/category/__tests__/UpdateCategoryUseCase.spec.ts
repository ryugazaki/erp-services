import { describe, beforeEach, it, expect } from '@jest/globals';
import { UpdateCategoryUseCase } from '../UpdateCategoryUseCase';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Category } from '@inventory/domain/entities/Category';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
  let categoryRepo: MockCategoryRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    categoryRepo = new MockCategoryRepository();
    eventBus = new MockEventBus();
    useCase = new UpdateCategoryUseCase(categoryRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when updating name', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        name: 'Computers',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: category.id,
        name: 'Computers',
        code: 'ELEC',
      });
    });

    it('should return success result when updating multiple fields', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        name: 'Computers',
        description: 'Computer products',
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: category.id,
        name: 'Computers',
        description: 'Computer products',
      });
    });

    it('should return success result when updating with parent', async () => {
      // Arrange
      const parentCategory = Category.create({
        name: 'Products',
        code: 'PROD',
      }).getValue();
      parentCategory.pullEvents();

      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();

      categoryRepo.setCategories([parentCategory, category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        parentId: parentCategory.id,
      });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().parentId).toBe(parentCategory.id);
    });

    it('should return success result when keeping parent undefined', async () => {
      // Arrange
      const parentCategory = Category.create({
        name: 'Products',
        code: 'PROD',
      }).getValue();
      parentCategory.pullEvents();

      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
        parentId: parentCategory.id,
      }).getValue();
      category.pullEvents();

      categoryRepo.setCategories([parentCategory, category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        name: 'Updated Electronics',
      });

      // Assert - parent should remain unchanged when parentId is not provided
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().parentId).toBe(parentCategory.id);
    });

    it('should return failure result when category not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act
      const result = await useCase.execute({
        id: nonExistentId,
        name: 'Updated Name',
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return failure result when parent category not found', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        parentId: 'non-existent-parent-id',
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PARENT_CATEGORY_NOT_FOUND');
    });

    it('should return failure result when category is its own parent', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        parentId: category.id,
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CANNOT_BE_SELF_PARENT');
    });

    it('should return failure result when name is empty', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({
        id: category.id,
        name: '',
      });

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NAME_REQUIRED');
    });

    it('should update category in repository on success', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      await useCase.execute({
        id: category.id,
        name: 'Computers',
      });

      // Assert
      const updated = await categoryRepo.findById(category.id);
      expect(updated?.name).toBe('Computers');
    });

    it('should update category in repository on success', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      await useCase.execute({
        id: category.id,
        name: 'Computers',
      });

      // Assert
      const updated = await categoryRepo.findById(category.id);
      expect(updated?.name).toBe('Computers');
    });
  });
});
