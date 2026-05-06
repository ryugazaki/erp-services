import { PaginatedResult } from '@erp/shared/kernel';
import { Department } from '../entities/Department';

export interface DepartmentFilter {
  search?: string;
  isActive?: boolean;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  findByCode(code: string): Promise<Department | null>;
  findAll(filter: DepartmentFilter, pagination: PaginationInput): Promise<PaginatedResult<Department>>;
  save(department: Department): Promise<void>;
  update(department: Department): Promise<void>;
}
