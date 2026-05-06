import { Attendance } from '../entities/Attendance';
import { PaginatedResult } from '@erp/shared/kernel';

export interface AttendanceFilter {
  employeeId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface AttendanceMonthlySummary {
  totalDays: number;
  presentDays: number;
  clockedOutDays: number;
  absentDays: number;
  averageClockInTime: string | null;
  averageClockOutTime: string | null;
  totalWorkHours: number;
}

export interface IAttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findActiveByEmployeeForDate(employeeId: string, date: Date): Promise<Attendance | null>;
  findAll(filter: AttendanceFilter, pagination: PaginationInput): Promise<PaginatedResult<Attendance>>;
  save(attendance: Attendance): Promise<void>;
  update(attendance: Attendance): Promise<void>;
  getMonthlySummary(employeeId: string, month: number, year: number): Promise<AttendanceMonthlySummary>;
}
