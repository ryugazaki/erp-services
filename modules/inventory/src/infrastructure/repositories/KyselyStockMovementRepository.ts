import { injectable } from 'tsyringe';
import { Kysely, sql } from 'kysely';
import { IStockMovementRepository, StockMovementFilter, PaginationInput, StockLevel } from '../../domain/repositories/IStockMovementRepository';
import { StockMovement } from '../../domain/entities/StockMovement';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<StockMovement | null> {
    const row = await this.db
      .selectFrom('inventory.stock_movements')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: StockMovementFilter, pagination: PaginationInput): Promise<PaginatedResult<StockMovement>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('inventory.stock_movements')
      .selectAll();

    if (filter.productId) {
      query = query.where('product_id', '=', filter.productId);
    }

    if (filter.warehouseId) {
      query = query.where('warehouse_id', '=', filter.warehouseId);
    }

    if (filter.movementType) {
      query = query.where('movement_type', '=', filter.movementType);
    }

    if (filter.referenceType) {
      query = query.where('reference_type', '=', filter.referenceType);
    }

    if (filter.dateFrom) {
      query = query.where('occurred_at', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      query = query.where('occurred_at', '<=', filter.dateTo);
    }

    const countQuery = this.db
      .selectFrom('inventory.stock_movements')
      .select(this.db.fn.countAll().as('count'));

    if (filter.productId) {
      countQuery.where('product_id', '=', filter.productId);
    }
    if (filter.warehouseId) {
      countQuery.where('warehouse_id', '=', filter.warehouseId);
    }
    if (filter.movementType) {
      countQuery.where('movement_type', '=', filter.movementType);
    }
    if (filter.referenceType) {
      countQuery.where('reference_type', '=', filter.referenceType);
    }
    if (filter.dateFrom) {
      countQuery.where('occurred_at', '>=', filter.dateFrom);
    }
    if (filter.dateTo) {
      countQuery.where('occurred_at', '<=', filter.dateTo);
    }

    const [{ count }] = await countQuery.execute();
    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('occurred_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .execute();

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items: rows.map((row) => this.toEntity(row)),
      meta,
    };
  }

  async save(movement: StockMovement): Promise<void> {
    await this.db
      .insertInto('inventory.stock_movements')
      .values({
        id: movement.id,
        product_id: movement.productId,
        warehouse_id: movement.warehouseId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        reference_type: movement.referenceType,
        reference_id: movement.referenceId,
        notes: movement.notes,
        occurred_at: movement.occurredAt,
        created_at: movement.createdAt,
      })
      .execute();
  }

  async getCurrentStock(productId: string, warehouseId?: string): Promise<StockLevel[]> {
    const warehouseFilter = warehouseId ? sql`AND sm.warehouse_id = ${warehouseId}` : sql``;

    const rows = await sql`
      SELECT
        p.id as "productId",
        p.name as "productName",
        p.sku as "sku",
        w.id as "warehouseId",
        w.name as "warehouseName",
        COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as "currentQuantity"
      FROM inventory.products p
      CROSS JOIN inventory.warehouses w
      LEFT JOIN inventory.stock_movements sm ON sm.product_id = p.id AND sm.warehouse_id = w.id
      WHERE p.id = ${productId}
        ${warehouseFilter}
      GROUP BY p.id, p.name, p.sku, w.id, w.name
    `.execute(this.db);

    return rows.rows.map((row: any) => ({
      productId: row.productId,
      productName: row.productName,
      sku: row.sku,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      currentQuantity: Number(row.currentQuantity),
    }));
  }

  async getLowStockProducts(threshold: number = 10): Promise<StockLevel[]> {
    const rows = await sql`
      SELECT
        p.id as "productId",
        p.name as "productName",
        p.sku as "sku",
        p.minimum_stock as "minimumStock",
        w.id as "warehouseId",
        w.name as "warehouseName",
        COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as "currentQuantity"
      FROM inventory.products p
      CROSS JOIN inventory.warehouses w
      LEFT JOIN inventory.stock_movements sm ON sm.product_id = p.id AND sm.warehouse_id = w.id
      WHERE p.is_active = true
        AND p.minimum_stock > 0
      GROUP BY p.id, p.name, p.sku, p.minimum_stock, w.id, w.name
      HAVING COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END), 0) <= p.minimum_stock
    `.execute(this.db);

    return rows.rows.map((row: any) => ({
      productId: row.productId,
      productName: row.productName,
      sku: row.sku,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      currentQuantity: Number(row.currentQuantity),
    }));
  }

  private toEntity(row: any): StockMovement {
    return StockMovement.reconstitute({
      id: row.id,
      productId: row.product_id,
      warehouseId: row.warehouse_id,
      movementType: row.movement_type,
      quantity: row.quantity,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      notes: row.notes,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    });
  }
}
