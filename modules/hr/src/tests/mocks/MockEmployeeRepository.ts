import { Employee, EmployeeState } from '../../domain/entities/Employee';
import { IEmployeeRepository, EmployeeFilter, PaginationInput } from '../../domain/repositories/IEmployeeRepository';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockEmployeeRepository implements IEmployeeRepository {
  private employees: Map<string, Employee> = new Map();

  async findById(id: string): Promise<Employee | null> {
    return this.employees.get(id) ?? null;
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<Employee | null> {
    for (const emp of this.employees.values()) {
      if (emp.employeeNumber === employeeNumber) return emp;
    }
    return null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    for (const emp of this.employees.values()) {
      if (emp.email === email) return emp;
    }
    return null;
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    for (const emp of this.employees.values()) {
      if (emp.userId === userId) return emp;
    }
    return null;
  }

  async findAll(filter: EmployeeFilter, pagination: PaginationInput): Promise<PaginatedResult<Employee>> {
    let items = Array.from(this.employees.values());

    if (filter.status) {
      items = items.filter((e) => e.status === filter.status);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.firstName.toLowerCase().includes(search) ||
          e.lastName.toLowerCase().includes(search),
      );
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

  async save(employee: Employee): Promise<void> {
    this.employees.set(employee.id, employee);
  }

  async update(employee: Employee): Promise<void> {
    this.employees.set(employee.id, employee);
  }
}
