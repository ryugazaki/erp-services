import { Employee } from '../entities/Employee';
import { PaginatedResult } from '@erp/shared/kernel';

export interface EmployeeFilter {
  status?: string;
  search?: string;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findAll(filter: EmployeeFilter, pagination: PaginationInput): Promise<PaginatedResult<Employee>>;
  save(employee: Employee): Promise<void>;
  update(employee: Employee): Promise<void>;
}
