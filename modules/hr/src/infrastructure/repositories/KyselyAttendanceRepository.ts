import { injectable } from 'tsyringe';
import { Kysely, sql } from 'kysely';
import { IAttendanceRepository, AttendanceFilter, PaginationInput, AttendanceMonthlySummary } from '../../domain/repositories/IAttendanceRepository';
import { Attendance, AttendanceState } from '../../domain/entities/Attendance';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

@injectable()
export class KyselyAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Attendance | null> {
    const row = await this.db
      .selectFrom('hr.attendances')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findActiveByEmployeeForDate(employeeId: string, date: Date): Promise<Attendance | null> {
    const row = await this.db
      .selectFrom('hr.attendances')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .where('date', '=', date)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findAll(filter: AttendanceFilter, pagination: PaginationInput): Promise<PaginatedResult<Attendance>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('hr.attendances')
      .selectAll();

    if (filter.employeeId) {
      query = query.where('employee_id', '=', filter.employeeId);
    }

    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }

    if (filter.dateFrom) {
      query = query.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      query = query.where('date', '<=', filter.dateTo);
    }

    let countQuery = this.db
      .selectFrom('hr.attendances')
      .select(this.db.fn.countAll().as('count'));

    if (filter.employeeId) {
      countQuery = countQuery.where('employee_id', '=', filter.employeeId);
    }

    if (filter.status) {
      countQuery = countQuery.where('status', '=', filter.status);
    }

    if (filter.dateFrom) {
      countQuery = countQuery.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      countQuery = countQuery.where('date', '<=', filter.dateTo);
    }

    const [{ count }] = await countQuery.execute();

    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('date', 'desc')
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

  async save(attendance: Attendance): Promise<void> {
    await this.db
      .insertInto('hr.attendances')
      .values({
        id: attendance.id,
        employee_id: attendance.employeeId,
        date: attendance.date,
        clocked_in_at: attendance.clockedInAt,
        clocked_out_at: attendance.clockedOutAt,
        status: attendance.status,
        created_at: attendance.createdAt,
        updated_at: attendance.updatedAt,
      })
      .execute();
  }

  async update(attendance: Attendance): Promise<void> {
    await this.db
      .updateTable('hr.attendances')
      .set({
        clocked_out_at: attendance.clockedOutAt,
        status: attendance.status,
        updated_at: attendance.updatedAt,
      })
      .where('id', '=', attendance.id)
      .execute();
  }

  async getMonthlySummary(employeeId: string, month: number, year: number): Promise<AttendanceMonthlySummary> {
    const row = await this.db
      .selectFrom('hr.attendances')
      .select([
        this.db.fn.countAll().as('total_days'),
        sql<number>`COUNT(*) FILTER (WHERE status IN ('CLOCKED_IN', 'CLOCKED_OUT'))`.as('present_days'),
        sql<number>`COUNT(*) FILTER (WHERE status = 'CLOCKED_OUT')`.as('clocked_out_days'),
        sql<number>`COUNT(*) FILTER (WHERE status = 'ABSENT')`.as('absent_days'),
        sql<string | null>`TO_CHAR(AVG(clocked_in_at::time), 'HH24:MI')`.as('average_clock_in_time'),
        sql<string | null>`TO_CHAR(AVG(clocked_out_at::time), 'HH24:MI')`.as('average_clock_out_time'),
        sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (clocked_out_at - clocked_in_at)) / 3600), 0)`.as('total_work_hours'),
      ])
      .where('employee_id', '=', employeeId)
      .where(sql`EXTRACT(MONTH FROM date)`, '=', month)
      .where(sql`EXTRACT(YEAR FROM date)`, '=', year)
      .executeTakeFirst();

    if (!row) {
      return {
        totalDays: 0,
        presentDays: 0,
        clockedOutDays: 0,
        absentDays: 0,
        averageClockInTime: null,
        averageClockOutTime: null,
        totalWorkHours: 0,
      };
    }

    return {
      totalDays: Number(row.total_days),
      presentDays: Number(row.present_days),
      clockedOutDays: Number(row.clocked_out_days),
      absentDays: Number(row.absent_days),
      averageClockInTime: row.average_clock_in_time,
      averageClockOutTime: row.average_clock_out_time,
      totalWorkHours: Number(Number(row.total_work_hours).toFixed(2)),
    };
  }

  private toEntity(row: any): Attendance {
    return Attendance.reconstitute({
      id: row.id,
      employeeId: row.employee_id,
      date: row.date,
      clockedInAt: row.clocked_in_at,
      clockedOutAt: row.clocked_out_at,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
