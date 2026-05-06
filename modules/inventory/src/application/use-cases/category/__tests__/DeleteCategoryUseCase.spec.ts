import { describe, beforeEach, it, expect } from '@jest/globals';
import { DeleteCategoryUseCase } from '../DeleteCategoryUseCase';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Category } from '@inventory/domain/entities/Category';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let categoryRepo: MockCategoryRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    categoryRepo = new MockCategoryRepository();
    eventBus = new MockEventBus();
    useCase = new DeleteCategoryUseCase(categoryRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when deactivating active category', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({ id: category.id });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        id: category.id,
        name: 'Electronics',
        isActive: false,
      });
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

    it('should return failure result when category is already inactive', async () => {
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
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_ALREADY_INACTIVE');
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
      await useCase.execute({ id: category.id });

      // Assert
      const updated = await categoryRepo.findById(category.id);
      expect(updated?.isActive).toBe(false);
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
      await useCase.execute({ id: category.id });

      // Assert
      const updated = await categoryRepo.findById(category.id);
      expect(updated?.isActive).toBe(false);
    });
  });
});
