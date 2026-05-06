import { ICategoryRepository } from '@inventory/domain/repositories/ICategoryRepository';
import { Category } from '@inventory/domain/entities/Category';

export class MockCategoryRepository implements ICategoryRepository {
  private categories: Map<string, Category> = new Map();

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) || null;
  }

  async findByCode(code: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.code === code) return category;
    }
    return null;
  }

  async findAll(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async save(category: Category): Promise<void> {
    this.categories.set(category.id, category);
  }

  async update(category: Category): Promise<void> {
    this.categories.set(category.id, category);
  }

  // Helper methods for testing
  setCategories(categories: Category[]): void {
    this.categories.clear();
    for (const category of categories) {
      this.categories.set(category.id, category);
    }
  }

  clear(): void {
    this.categories.clear();
  }

  count(): number {
    return this.categories.size;
  }
}
