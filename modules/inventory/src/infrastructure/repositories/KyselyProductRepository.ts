import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IProductRepository, ProductFilter, PaginationInput } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyProductRepository implements IProductRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.db
      .selectFrom('inventory.products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findBySKU(sku: string): Promise<Product | null> {
    const row = await this.db
      .selectFrom('inventory.products')
      .selectAll()
      .where('sku', '=', sku)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: ProductFilter, pagination: PaginationInput): Promise<PaginatedResult<Product>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('inventory.products')
      .selectAll();

    if (filter.categoryId) {
      query = query.where('category_id', '=', filter.categoryId);
    }

    if (filter.isActive !== undefined) {
      query = query.where('is_active', '=', filter.isActive);
    }

    if (filter.search) {
      const search = filter.search;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('sku', 'ilike', `%${search}%`),
          eb('description', 'ilike', `%${search}%`),
        ])
      );
    }

    const countQuery = this.db
      .selectFrom('inventory.products')
      .select(this.db.fn.countAll().as('count'));

    if (filter.categoryId) {
      countQuery.where('category_id', '=', filter.categoryId);
    }
    if (filter.isActive !== undefined) {
      countQuery.where('is_active', '=', filter.isActive);
    }
    if (filter.search) {
      countQuery.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filter.search}%`),
          eb('sku', 'ilike', `%${filter.search}%`),
          eb('description', 'ilike', `%${filter.search}%`),
        ])
      );
    }

    const [{ count }] = await countQuery.execute();
    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('created_at', 'desc')
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

  async save(product: Product): Promise<void> {
    await this.db
      .insertInto('inventory.products')
      .values({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category_id: product.categoryId,
        unit_of_measure: product.unitOfMeasure,
        base_price: product.basePrice,
        minimum_stock: product.minimumStock,
        is_active: product.isActive,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      })
      .execute();
  }

  async update(product: Product): Promise<void> {
    await this.db
      .updateTable('inventory.products')
      .set({
        name: product.name,
        description: product.description,
        category_id: product.categoryId,
        unit_of_measure: product.unitOfMeasure,
        base_price: product.basePrice,
        minimum_stock: product.minimumStock,
        is_active: product.isActive,
        updated_at: product.updatedAt,
      })
      .where('id', '=', product.id)
      .execute();
  }

  private toEntity(row: any): Product {
    return Product.reconstitute({
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      unitOfMeasure: row.unit_of_measure,
      basePrice: Number(row.base_price),
      minimumStock: row.minimum_stock,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
