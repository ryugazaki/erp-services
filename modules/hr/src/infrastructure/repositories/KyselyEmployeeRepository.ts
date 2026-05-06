import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IEmployeeRepository, EmployeeFilter, PaginationInput } from '../../domain/repositories/IEmployeeRepository';
import { Employee, EmployeeState } from '../../domain/entities/Employee';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Employee | null> {
    const row = await this.db
      .selectFrom('hr.employees')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<Employee | null> {
    const row = await this.db
      .selectFrom('hr.employees')
      .selectAll()
      .where('employee_number', '=', employeeNumber)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const row = await this.db
      .selectFrom('hr.employees')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const row = await this.db
      .selectFrom('hr.employees')
      .selectAll()
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: EmployeeFilter, pagination: PaginationInput): Promise<PaginatedResult<Employee>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('hr.employees')
      .selectAll()
      .where('deleted_at', 'is', null);

    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }

    if (filter.search) {
      const search = filter.search;
      query = query.where((eb) =>
        eb.or([
          eb('first_name', 'ilike', `%${search}%`),
          eb('last_name', 'ilike', `%${search}%`),
        ])
      );
    }

    const [{ count }] = await this.db
      .selectFrom('hr.employees')
      .select(this.db.fn.countAll().as('count'))
      .where('deleted_at', 'is', null)
      .$if(!!filter.status, (qb) => qb.where('status', '=', filter.status!))
      .$if(!!filter.search, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('first_name', 'ilike', `%${filter.search}%`),
            eb('last_name', 'ilike', `%${filter.search}%`),
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

  async save(employee: Employee): Promise<void> {
    await this.db
      .insertInto('hr.employees')
      .values({
        id: employee.id,
        employee_number: employee.employeeNumber,
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone || null,
        department_id: employee.departmentId,
        position: employee.position,
        hire_date: employee.hireDate,
        status: employee.status,
        user_id: employee.userId,
        created_at: employee.createdAt,
        updated_at: employee.updatedAt,
      })
      .execute();
  }

  async update(employee: Employee): Promise<void> {
    await this.db
      .updateTable('hr.employees')
      .set({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone || null,
        department_id: employee.departmentId,
        position: employee.position,
        status: employee.status,
        updated_at: employee.updatedAt,
      })
      .where('id', '=', employee.id)
      .execute();
  }

  private toEntity(row: any): Employee {
    return Employee.reconstitute({
      id: row.id,
      employeeNumber: row.employee_number,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone ?? '',
      departmentId: row.department_id,
      position: row.position,
      hireDate: row.hire_date,
      status: row.status,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
