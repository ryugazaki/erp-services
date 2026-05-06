import { describe, beforeEach, it, expect } from '@jest/globals';
import { ListCategoriesUseCase } from '../ListCategoriesUseCase';
import { MockCategoryRepository } from '@inventory/tests/mocks/MockCategoryRepository';
import { Category } from '@inventory/domain/entities/Category';

describe('ListCategoriesUseCase', () => {
  let useCase: ListCategoriesUseCase;
  let categoryRepo: MockCategoryRepository;

  beforeEach(() => {
    categoryRepo = new MockCategoryRepository();
    useCase = new ListCategoriesUseCase(categoryRepo);
  });

  describe('execute', () => {
    it('should return success result with all categories', async () => {
      // Arrange
      const category1 = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      category1.pullEvents();

      const category2 = Category.create({
        name: 'Clothing',
        code: 'CLOTH',
      }).getValue();
      category2.pullEvents();

      categoryRepo.setCategories([category1, category2]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(2);

      // Find categories by name since order is not guaranteed
      const electronics = result.getValue().items.find(item => item.name === 'Electronics');
      const clothing = result.getValue().items.find(item => item.name === 'Clothing');

      expect(electronics).toMatchObject({
        name: 'Electronics',
        code: 'ELEC',
      });
      expect(clothing).toMatchObject({
        name: 'Clothing',
        code: 'CLOTH',
      });
    });

    it('should return success result with empty array when no categories exist', async () => {
      // Arrange
      categoryRepo.setCategories([]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(0);
    });

    it('should return success result filtered by active status when isActive is true', async () => {
      // Arrange
      const activeCategory = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      activeCategory.pullEvents();

      const inactiveCategory = Category.create({
        name: 'Clothing',
        code: 'CLOTH',
      }).getValue();
      inactiveCategory.pullEvents();
      inactiveCategory.deactivate();
      inactiveCategory.pullEvents();

      categoryRepo.setCategories([activeCategory, inactiveCategory]);

      // Act
      const result = await useCase.execute({ isActive: true });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Electronics',
        isActive: true,
      });
    });

    it('should return success result filtered by active status when isActive is false', async () => {
      // Arrange
      const activeCategory = Category.create({
        name: 'Electronics',
        code: 'ELEC',
      }).getValue();
      activeCategory.pullEvents();

      const inactiveCategory = Category.create({
        name: 'Clothing',
        code: 'CLOTH',
      }).getValue();
      inactiveCategory.pullEvents();
      inactiveCategory.deactivate();
      inactiveCategory.pullEvents();

      categoryRepo.setCategories([activeCategory, inactiveCategory]);

      // Act
      const result = await useCase.execute({ isActive: false });

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items).toHaveLength(1);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Clothing',
        isActive: false,
      });
    });

    it('should return success result with categories including description', async () => {
      // Arrange
      const category = Category.create({
        name: 'Electronics',
        code: 'ELEC',
        description: 'Electronic products',
      }).getValue();
      category.pullEvents();
      categoryRepo.setCategories([category]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().items[0]).toMatchObject({
        name: 'Electronics',
        description: 'Electronic products',
      });
    });

    it('should return success result with categories including parent', async () => {
      // Arrange
      const parentCategory = Category.create({
        name: 'Products',
        code: 'PROD',
      }).getValue();
      parentCategory.pullEvents();

      const childCategory = Category.create({
        name: 'Electronics',
        code: 'ELEC',
        parentId: parentCategory.id,
      }).getValue();
      childCategory.pullEvents();

      categoryRepo.setCategories([parentCategory, childCategory]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isSuccess()).toBe(true);
      const childItem = result.getValue().items.find(item => item.name === 'Electronics');
      expect(childItem).toMatchObject({
        name: 'Electronics',
        parentId: parentCategory.id,
      });
    });
  });
});
