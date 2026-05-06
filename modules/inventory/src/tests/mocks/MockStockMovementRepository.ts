import { IStockMovementRepository, StockMovementFilter, PaginationInput, StockLevel } from '@inventory/domain/repositories/IStockMovementRepository';
import { StockMovement } from '@inventory/domain/entities/StockMovement';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockStockMovementRepository implements IStockMovementRepository {
  private movements: Map<string, StockMovement> = new Map();

  async findById(id: string): Promise<StockMovement | null> {
    return this.movements.get(id) || null;
  }

  async findAll(filter: StockMovementFilter, pagination: PaginationInput): Promise<PaginatedResult<StockMovement>> {
    let items = Array.from(this.movements.values());

    if (filter.productId) {
      items = items.filter((m) => m.productId === filter.productId);
    }

    if (filter.warehouseId) {
      items = items.filter((m) => m.warehouseId === filter.warehouseId);
    }

    if (filter.movementType) {
      items = items.filter((m) => m.movementType === filter.movementType);
    }

    if (filter.referenceType) {
      items = items.filter((m) => m.referenceType === filter.referenceType);
    }

    if (filter.dateFrom) {
      items = items.filter((m) => m.occurredAt >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      items = items.filter((m) => m.occurredAt <= filter.dateTo!);
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;

    const paginatedItems = items
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
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

  async save(movement: StockMovement): Promise<void> {
    this.movements.set(movement.id, movement);
  }

  async getCurrentStock(productId: string, warehouseId?: string): Promise<StockLevel[]> {
    // Mock implementation - returns dummy stock levels
    return [];
  }

  async getLowStockProducts(threshold?: number): Promise<StockLevel[]> {
    // Mock implementation - returns empty array
    return [];
  }

  // Helper methods for testing
  setMovements(movements: StockMovement[]): void {
    this.movements.clear();
    for (const movement of movements) {
      this.movements.set(movement.id, movement);
    }
  }

  clear(): void {
    this.movements.clear();
  }

  count(): number {
    return this.movements.size;
  }
}
