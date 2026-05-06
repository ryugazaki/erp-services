import { Attendance } from '../../domain/entities/Attendance';
import { IAttendanceRepository, AttendanceFilter, PaginationInput, AttendanceMonthlySummary } from '../../domain/repositories/IAttendanceRepository';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockAttendanceRepository implements IAttendanceRepository {
  private attendances: Map<string, Attendance> = new Map();

  async findById(id: string): Promise<Attendance | null> {
    return this.attendances.get(id) ?? null;
  }

  async findActiveByEmployeeForDate(employeeId: string, date: Date): Promise<Attendance | null> {
    const dateStr = date.toDateString();
    for (const a of this.attendances.values()) {
      if (a.employeeId === employeeId && a.date.toDateString() === dateStr) {
        return a;
      }
    }
    return null;
  }

  async findAll(filter: AttendanceFilter, pagination: PaginationInput): Promise<PaginatedResult<Attendance>> {
    let items = Array.from(this.attendances.values());

    if (filter.employeeId) {
      items = items.filter((a) => a.employeeId === filter.employeeId);
    }
    if (filter.status) {
      items = items.filter((a) => a.status === filter.status);
    }
    if (filter.dateFrom) {
      items = items.filter((a) => a.date >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      items = items.filter((a) => a.date <= filter.dateTo!);
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paged = items.slice(start, start + pagination.limit);

    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    };

    return { items: paged, meta };
  }

  async save(attendance: Attendance): Promise<void> {
    this.attendances.set(attendance.id, attendance);
  }

  async update(attendance: Attendance): Promise<void> {
    this.attendances.set(attendance.id, attendance);
  }

  async getMonthlySummary(employeeId: string, month: number, year: number): Promise<AttendanceMonthlySummary> {
    const records = Array.from(this.attendances.values()).filter((a) => {
      return a.employeeId === employeeId &&
        a.date.getMonth() + 1 === month &&
        a.date.getFullYear() === year;
    });

    const presentDays = records.filter((a) => a.status === 'CLOCKED_IN' || a.status === 'CLOCKED_OUT').length;
    const clockedOutDays = records.filter((a) => a.status === 'CLOCKED_OUT').length;
    const absentDays = records.filter((a) => a.status === 'ABSENT').length;

    const clockedInRecords = records.filter((a) => a.status === 'CLOCKED_OUT');
    let totalWorkHours = 0;
    for (const r of clockedInRecords) {
      if (r.clockedOutAt) {
        totalWorkHours += (r.clockedOutAt.getTime() - r.clockedInAt.getTime()) / (1000 * 60 * 60);
      }
    }

    return {
      totalDays: records.length,
      presentDays,
      clockedOutDays,
      absentDays,
      averageClockInTime: null,
      averageClockOutTime: null,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    };
  }
}
