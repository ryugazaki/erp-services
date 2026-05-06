import { Leave } from '../entities/Leave';
import { PaginatedResult } from '@erp/shared/kernel';

export interface LeaveFilter {
  employeeId?: string;
  status?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface ILeaveRepository {
  findById(id: string): Promise<Leave | null>;
  findAll(filter: LeaveFilter, pagination: PaginationInput): Promise<PaginatedResult<Leave>>;
  save(leave: Leave): Promise<void>;
  update(leave: Leave): Promise<void>;
}
