import { inject, injectable } from 'tsyringe';
import { IUseCase, Result, PaginatedResult } from '@erp/shared/kernel';
import { IDepartmentRepository, DepartmentFilter, PaginationInput } from '../../../domain/repositories/IDepartmentRepository';
import { ListDepartmentsDTO } from '../../dtos/department/ListDepartmentsDTO';
import { TOKENS } from '../../tokens';

export interface DepartmentItemResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
}

export interface ListDepartmentsResult {
  items: DepartmentItemResult[];
  meta: PaginatedResult<unknown>['meta'];
}

@injectable()
export class ListDepartmentsUseCase implements IUseCase<ListDepartmentsDTO, Result<ListDepartmentsResult>> {
  constructor(
    @inject(TOKENS.DepartmentRepository) private readonly departmentRepo: IDepartmentRepository,
  ) {}

  async execute(dto: ListDepartmentsDTO): Promise<Result<ListDepartmentsResult>> {
    const filter: DepartmentFilter = {};

    if (dto.isActive !== undefined) {
      filter.isActive = dto.isActive;
    }

    if (dto.search) {
      filter.search = dto.search;
    }

    const pagination: PaginationInput = {
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    };

    const paginated = await this.departmentRepo.findAll(filter, pagination);

    const items: DepartmentItemResult[] = paginated.items.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      headId: department.headId,
      isActive: department.isActive,
    }));

    return Result.ok({
      items,
      meta: paginated.meta,
    });
  }
}
