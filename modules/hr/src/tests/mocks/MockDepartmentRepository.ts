import { Department } from '../../domain/entities/Department';
import { IDepartmentRepository, DepartmentFilter, PaginationInput } from '../../domain/repositories/IDepartmentRepository';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockDepartmentRepository implements IDepartmentRepository {
  private departments: Map<string, Department> = new Map();

  async findById(id: string): Promise<Department | null> {
    return this.departments.get(id) ?? null;
  }

  async findByCode(code: string): Promise<Department | null> {
    for (const dept of this.departments.values()) {
      if (dept.code === code) return dept;
    }
    return null;
  }

  async findAll(filter: DepartmentFilter, pagination: PaginationInput): Promise<PaginatedResult<Department>> {
    let items = Array.from(this.departments.values());

    if (filter.isActive !== undefined) {
      items = items.filter((d) => d.isActive === filter.isActive);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.code.toLowerCase().includes(search),
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

  async save(department: Department): Promise<void> {
    this.departments.set(department.id, department);
  }

  async update(department: Department): Promise<void> {
    this.departments.set(department.id, department);
  }
}
