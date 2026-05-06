import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IDepartmentRepository, DepartmentFilter, PaginationInput } from '../../domain/repositories/IDepartmentRepository';
import { Department } from '../../domain/entities/Department';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyDepartmentRepository implements IDepartmentRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Department | null> {
    const row = await this.db
      .selectFrom('hr.departments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Department | null> {
    const row = await this.db
      .selectFrom('hr.departments')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: DepartmentFilter, pagination: PaginationInput): Promise<PaginatedResult<Department>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('hr.departments')
      .selectAll();

    if (filter.isActive !== undefined) {
      query = query.where('is_active', '=', filter.isActive);
    }

    if (filter.search) {
      const search = filter.search;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('code', 'ilike', `%${search}%`),
        ])
      );
    }

    const [{ count }] = await this.db
      .selectFrom('hr.departments')
      .select(this.db.fn.countAll().as('count'))
      .$if(filter.isActive !== undefined, (qb) => qb.where('is_active', '=', filter.isActive!))
      .$if(!!filter.search, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('name', 'ilike', `%${filter.search}%`),
            eb('code', 'ilike', `%${filter.search}%`),
          ])
        )
      )
      .execute();

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

  async save(department: Department): Promise<void> {
    await this.db
      .insertInto('hr.departments')
      .values({
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        head_id: department.headId,
        is_active: department.isActive,
        created_at: department.createdAt,
        updated_at: department.updatedAt,
      })
      .execute();
  }

  async update(department: Department): Promise<void> {
    await this.db
      .updateTable('hr.departments')
      .set({
        name: department.name,
        description: department.description,
        head_id: department.headId,
        is_active: department.isActive,
        updated_at: department.updatedAt,
      })
      .where('id', '=', department.id)
      .execute();
  }

  private toEntity(row: any): Department {
    return Department.reconstitute({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      headId: row.head_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
