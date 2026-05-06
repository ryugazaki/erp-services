import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { ILeaveTypeRepository } from '../../domain/repositories/ILeaveTypeRepository';
import { LeaveType, LeaveTypeState } from '../../domain/entities/LeaveType';

@injectable()
export class KyselyLeaveTypeRepository implements ILeaveTypeRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<LeaveType | null> {
    const row = await this.db
      .selectFrom('hr.leave_types')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<LeaveType | null> {
    const row = await this.db
      .selectFrom('hr.leave_types')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<LeaveType[]> {
    const rows = await this.db
      .selectFrom('hr.leave_types')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.toEntity(row));
  }

  async save(leaveType: LeaveType): Promise<void> {
    await this.db
      .insertInto('hr.leave_types')
      .values({
        id: leaveType.id,
        name: leaveType.name,
        code: leaveType.code,
        description: leaveType.description,
        default_days: leaveType.defaultDays,
        is_paid: leaveType.isPaid,
        is_active: leaveType.isActive,
        created_at: leaveType.createdAt,
        updated_at: leaveType.updatedAt,
      })
      .execute();
  }

  async update(leaveType: LeaveType): Promise<void> {
    await this.db
      .updateTable('hr.leave_types')
      .set({
        name: leaveType.name,
        description: leaveType.description,
        default_days: leaveType.defaultDays,
        is_paid: leaveType.isPaid,
        is_active: leaveType.isActive,
        updated_at: leaveType.updatedAt,
      })
      .where('id', '=', leaveType.id)
      .execute();
  }

  private toEntity(row: any): LeaveType {
    return LeaveType.reconstitute({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      defaultDays: row.default_days,
      isPaid: row.is_paid,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
