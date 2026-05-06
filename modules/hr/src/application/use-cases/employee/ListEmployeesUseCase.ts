import { inject, injectable } from 'tsyringe';
import { IUseCase, Result, PaginatedResult } from '@erp/shared/kernel';
import { IEmployeeRepository, EmployeeFilter, PaginationInput } from '../../../domain/repositories/IEmployeeRepository';
import { ListEmployeesDTO } from '../../dtos/employee/ListEmployeesDTO';
import { TOKENS } from '../../tokens';

export interface EmployeeItemResult {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string | null;
  departmentId: string | null;
  hireDate: Date;
  status: string;
  userId: string | null;
}

export interface ListEmployeesResult {
  items: EmployeeItemResult[];
  meta: PaginatedResult<unknown>['meta'];
}

@injectable()
export class ListEmployeesUseCase implements IUseCase<ListEmployeesDTO, Result<ListEmployeesResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(dto: ListEmployeesDTO): Promise<Result<ListEmployeesResult>> {
    const filter: EmployeeFilter = {};

    if (dto.status) {
      filter.status = dto.status;
    }

    if (dto.search) {
      filter.search = dto.search;
    }

    const pagination: PaginationInput = {
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
    };

    const paginated = await this.employeeRepo.findAll(filter, pagination);

    const items: EmployeeItemResult[] = paginated.items.map((employee) => ({
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      departmentId: employee.departmentId,
      hireDate: employee.hireDate,
      status: employee.status,
      userId: employee.userId,
    }));

    return Result.ok({
      items,
      meta: paginated.meta,
    });
  }
}
