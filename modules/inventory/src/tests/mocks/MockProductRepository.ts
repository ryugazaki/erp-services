import { IProductRepository, ProductFilter, PaginationInput } from '@inventory/domain/repositories/IProductRepository';
import { Product } from '@inventory/domain/entities/Product';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockProductRepository implements IProductRepository {
  private products: Map<string, Product> = new Map();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findBySKU(sku: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.sku === sku) return product;
    }
    return null;
  }

  async findAll(filter: ProductFilter, pagination: PaginationInput): Promise<PaginatedResult<Product>> {
    let items = Array.from(this.products.values());

    if (filter.categoryId) {
      items = items.filter((p) => p.categoryId === filter.categoryId);
    }

    if (filter.isActive !== undefined) {
      items = items.filter((p) => p.isActive === filter.isActive);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      items = items.filter((p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.description?.toLowerCase().includes(search))
      );
    }

    if (filter.lowStock) {
      items = items.filter((p) => {
        // For mock purposes, we'll consider products with minimumStock > 0 as low stock
        return p.minimumStock > 0;
      });
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;

    const paginatedItems = items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(startIndex, startIndex + pagination.limit);

    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    };

    return {
      items: paginatedItems,
      meta,
    };
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async update(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  // Helper methods for testing
  setProducts(products: Product[]): void {
    this.products.clear();
    for (const product of products) {
      this.products.set(product.id, product);
    }
  }

  clear(): void {
    this.products.clear();
  }

  count(): number {
    return this.products.size;
  }
}
