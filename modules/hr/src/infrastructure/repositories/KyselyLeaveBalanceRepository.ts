import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { ILeaveBalanceRepository } from '../../domain/repositories/ILeaveBalanceRepository';
import { LeaveBalance, LeaveBalanceState } from '../../domain/entities/LeaveBalance';

@injectable()
export class KyselyLeaveBalanceRepository implements ILeaveBalanceRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<LeaveBalance | null> {
    const row = await this.db
      .selectFrom('hr.leave_balances')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByEmployeeAndTypeAndYear(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
    const row = await this.db
      .selectFrom('hr.leave_balances')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('leave_type_id', '=', leaveTypeId)
      .where('year', '=', year)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByEmployeeAndYear(employeeId: string, year: number): Promise<LeaveBalance[]> {
    const rows = await this.db
      .selectFrom('hr.leave_balances')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('year', '=', year)
      .execute();

    return rows.map((row) => this.toEntity(row));
  }

  async save(balance: LeaveBalance): Promise<void> {
    await this.db
      .insertInto('hr.leave_balances')
      .values({
        id: balance.id,
        employee_id: balance.employeeId,
        leave_type_id: balance.leaveTypeId,
        year: balance.year,
        total_days: balance.totalDays,
        used_days: balance.usedDays,
        remaining_days: balance.remainingDays,
        created_at: balance.createdAt,
        updated_at: balance.updatedAt,
      })
      .execute();
  }

  async update(balance: LeaveBalance): Promise<void> {
    await this.db
      .updateTable('hr.leave_balances')
      .set({
        total_days: balance.totalDays,
        used_days: balance.usedDays,
        remaining_days: balance.remainingDays,
        updated_at: balance.updatedAt,
      })
      .where('id', '=', balance.id)
      .execute();
  }

  private toEntity(row: any): LeaveBalance {
    return LeaveBalance.reconstitute({
      id: row.id,
      employeeId: row.employee_id,
      leaveTypeId: row.leave_type_id,
      year: row.year,
      totalDays: Number(row.total_days),
      usedDays: Number(row.used_days),
      remainingDays: Number(row.remaining_days),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
