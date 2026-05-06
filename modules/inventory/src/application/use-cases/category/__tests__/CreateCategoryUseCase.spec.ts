import { describe, beforeEach, it, expect } from '@jest/globals';
import { CreateCategoryUseCase } from '../CreateCategoryUseCase';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { MockEventBus } from '@inventory/tests/mocks/MockEventBus';
import { Category } from '@inventory/domain/entities/Category';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let categoryRepo: MockCategoryRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    categoryRepo = new MockCategoryRepository();
    eventBus = new MockEventBus();
    useCase = new CreateCategoryUseCase(categoryRepo, eventBus);
  });

  describe('execute', () => {
    it('should return success result when valid input provided', async () => {
      // Arrange
      const input = {
        name: 'Electronics',
        code: 'ELEC',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toMatchObject({
        name: 'Electronics',
        code: 'ELEC',
        isActive: true,
      });
    });

    it('should return success result when valid input provided with description', async () => {
      // Arrange
      const input = {
        name: 'Electronics',
        code: 'ELEC',
        description: 'Electronic products',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().description).toBe('Electronic products');
    });

    it('should return success result when valid input provided with parent', async () => {
      // Arrange
      const parentCategory = Category.create({
        name: 'Products',
        code: 'PROD',
      }).getValue();
      parentCategory.pullEvents(); // Clear CategoryCreated event
      categoryRepo.setCategories([parentCategory]);

      const input = {
        name: 'Electronics',
        code: 'ELEC',
        parentId: parentCategory.id,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().parentId).toBe(parentCategory.id);
    });

    it('should return failure result when code already exists', async () => {
      // Arrange
      const existingCategory = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      existingCategory.pullEvents(); // Clear CategoryCreated event
      categoryRepo.setCategories([existingCategory]);

      const input = {
        name: 'Different Name',
        code: 'ELEC',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_CODE_ALREADY_EXISTS');
    });

    it('should return failure result when name is empty', async () => {
      // Arrange
      const input = {
        name: '',
        code: 'TEST',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_NAME_REQUIRED');
    });

    it('should return failure result when code is empty', async () => {
      // Arrange
      const input = {
        name: 'Test Category',
        code: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('CATEGORY_CODE_REQUIRED');
    });

    it('should return failure result when parent category not found', async () => {
      // Arrange
      const input = {
        name: 'Electronics',
        code: 'ELEC',
        parentId: 'non-existent-parent-id',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PARENT_CATEGORY_NOT_FOUND');
    });

    it('should save category in repository', async () => {
      // Arrange
      const input = {
        name: 'Electronics',
        code: 'ELEC',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      const saved = await categoryRepo.findById(result.getValue().id);
      expect(saved).toBeTruthy();
      expect(saved?.name).toBe('Electronics');
    });

    it('should save category in repository', async () => {
      // Arrange
      const input = {
        name: 'Electronics',
        code: 'ELEC',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      const saved = await categoryRepo.findById(result.getValue().id);
      expect(saved).toBeTruthy();
      expect(saved?.name).toBe('Electronics');
    });
  });
});
