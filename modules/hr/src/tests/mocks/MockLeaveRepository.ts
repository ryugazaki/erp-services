import { Leave } from '../../domain/entities/Leave';
import { ILeaveRepository, LeaveFilter, PaginationInput } from '../../domain/repositories/ILeaveRepository';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

export class MockLeaveRepository implements ILeaveRepository {
  private leaves: Map<string, Leave> = new Map();

  async findById(id: string): Promise<Leave | null> {
    return this.leaves.get(id) ?? null;
  }

  async findAll(filter: LeaveFilter, pagination: PaginationInput): Promise<PaginatedResult<Leave>> {
    let items = Array.from(this.leaves.values());

    if (filter.employeeId) {
      items = items.filter((l) => l.employeeId === filter.employeeId);
    }

    if (filter.status) {
      items = items.filter((l) => l.status === filter.status);
    }

    if (filter.startDateFrom) {
      items = items.filter((l) => l.startDate >= filter.startDateFrom!);
    }

    if (filter.startDateTo) {
      items = items.filter((l) => l.startDate <= filter.startDateTo!);
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

  async save(leave: Leave): Promise<void> {
    this.leaves.set(leave.id, leave);
  }

  async update(leave: Leave): Promise<void> {
    this.leaves.set(leave.id, leave);
  }
}
