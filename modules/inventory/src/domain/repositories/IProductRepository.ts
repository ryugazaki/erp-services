import { Product } from '../entities/Product';
import { PaginatedResult } from '@erp/shared/kernel';

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySKU(sku: string): Promise<Product | null>;
  findAll(filter: ProductFilter, pagination: PaginationInput): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
}
