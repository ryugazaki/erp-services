import { StockMovement } from '../entities/StockMovement';
import { PaginatedResult } from '@erp/shared/kernel';

export interface StockMovementFilter {
  productId?: string;
  warehouseId?: string;
  movementType?: string;
  referenceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface StockLevel {
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
}

export interface IStockMovementRepository {
  findById(id: string): Promise<StockMovement | null>;
  findAll(filter: StockMovementFilter, pagination: PaginationInput): Promise<PaginatedResult<StockMovement>>;
  save(movement: StockMovement): Promise<void>;
  getCurrentStock(productId: string, warehouseId?: string): Promise<StockLevel[]>;
  getLowStockProducts(threshold?: number): Promise<StockLevel[]>;
}
