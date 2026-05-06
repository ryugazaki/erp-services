import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IWarehouseRepository } from '../../domain/repositories/IWarehouseRepository';
import { Warehouse } from '../../domain/entities/Warehouse';

@injectable()
export class KyselyWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Warehouse | null> {
    const row = await this.db
      .selectFrom('inventory.warehouses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const row = await this.db
      .selectFrom('inventory.warehouses')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<Warehouse[]> {
    const rows = await this.db
      .selectFrom('inventory.warehouses')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.toEntity(row));
  }

  async save(warehouse: Warehouse): Promise<void> {
    await this.db
      .insertInto('inventory.warehouses')
      .values({
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        location_id: warehouse.locationId,
        is_active: warehouse.isActive,
        created_at: warehouse.createdAt,
        updated_at: warehouse.updatedAt,
      })
      .execute();
  }

  async update(warehouse: Warehouse): Promise<void> {
    await this.db
      .updateTable('inventory.warehouses')
      .set({
        name: warehouse.name,
        address: warehouse.address,
        location_id: warehouse.locationId,
        is_active: warehouse.isActive,
        updated_at: warehouse.updatedAt,
      })
      .where('id', '=', warehouse.id)
      .execute();
  }

  private toEntity(row: any): Warehouse {
    return Warehouse.reconstitute({
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address,
      locationId: row.location_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
