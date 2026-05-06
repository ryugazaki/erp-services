import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { ILeaveRepository, LeaveFilter, PaginationInput } from '../../domain/repositories/ILeaveRepository';
import { Leave, LeaveState } from '../../domain/entities/Leave';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyLeaveRepository implements ILeaveRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Leave | null> {
    const row = await this.db
      .selectFrom('hr.leaves')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: LeaveFilter, pagination: PaginationInput): Promise<PaginatedResult<Leave>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('hr.leaves')
      .selectAll();

    if (filter.employeeId) {
      query = query.where('employee_id', '=', filter.employeeId);
    }

    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }

    if (filter.startDateFrom) {
      query = query.where('start_date', '>=', filter.startDateFrom);
    }

    if (filter.startDateTo) {
      query = query.where('start_date', '<=', filter.startDateTo);
    }

    let countQuery = this.db
      .selectFrom('hr.leaves')
      .select(this.db.fn.countAll().as('count'));

    if (filter.employeeId) {
      countQuery = countQuery.where('employee_id', '=', filter.employeeId);
    }

    if (filter.status) {
      countQuery = countQuery.where('status', '=', filter.status);
    }

    if (filter.startDateFrom) {
      countQuery = countQuery.where('start_date', '>=', filter.startDateFrom);
    }

    if (filter.startDateTo) {
      countQuery = countQuery.where('start_date', '<=', filter.startDateTo);
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

  async save(leave: Leave): Promise<void> {
    await this.db
      .insertInto('hr.leaves')
      .values({
        id: leave.id,
        employee_id: leave.employeeId,
        leave_type_id: leave.leaveTypeId,
        start_date: leave.startDate,
        end_date: leave.endDate,
        total_days: leave.totalDays,
        reason: leave.reason,
        status: leave.status,
        approved_by: leave.approvedBy,
        approved_at: leave.approvedAt,
        remarks: leave.remarks,
        cancelled_at: leave.cancelledAt,
        created_at: leave.createdAt,
        updated_at: leave.updatedAt,
      })
      .execute();
  }

  async update(leave: Leave): Promise<void> {
    await this.db
      .updateTable('hr.leaves')
      .set({
        status: leave.status,
        approved_by: leave.approvedBy,
        approved_at: leave.approvedAt,
        remarks: leave.remarks,
        cancelled_at: leave.cancelledAt,
        updated_at: leave.updatedAt,
      })
      .where('id', '=', leave.id)
      .execute();
  }

  private toEntity(row: any): Leave {
    return Leave.reconstitute({
      id: row.id,
      employeeId: row.employee_id,
      leaveTypeId: row.leave_type_id,
      startDate: row.start_date,
      endDate: row.end_date,
      totalDays: Number(row.total_days),
      reason: row.reason,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      remarks: row.remarks,
      cancelledAt: row.cancelled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
