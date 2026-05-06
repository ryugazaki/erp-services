import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { Category } from '../../domain/entities/Category';

@injectable()
export class KyselyCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.db
      .selectFrom('inventory.categories')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Category | null> {
    const row = await this.db
      .selectFrom('inventory.categories')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.db
      .selectFrom('inventory.categories')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.toEntity(row));
  }

  async save(category: Category): Promise<void> {
    await this.db
      .insertInto('inventory.categories')
      .values({
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description,
        parent_id: category.parentId,
        is_active: category.isActive,
        created_at: category.createdAt,
        updated_at: category.updatedAt,
      })
      .execute();
  }

  async update(category: Category): Promise<void> {
    await this.db
      .updateTable('inventory.categories')
      .set({
        name: category.name,
        description: category.description,
        parent_id: category.parentId,
        is_active: category.isActive,
        updated_at: category.updatedAt,
      })
      .where('id', '=', category.id)
      .execute();
  }

  private toEntity(row: any): Category {
    return Category.reconstitute({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      parentId: row.parent_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
