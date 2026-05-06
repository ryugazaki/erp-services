import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { TOKENS } from '../../tokens';

export interface GetDepartmentInput {
  id: string;
}

export interface GetDepartmentResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class GetDepartmentUseCase implements IUseCase<GetDepartmentInput, Result<GetDepartmentResult>> {
  constructor(
    @inject(TOKENS.DepartmentRepository) private readonly departmentRepo: IDepartmentRepository,
  ) {}

  async execute(input: GetDepartmentInput): Promise<Result<GetDepartmentResult>> {
    const department = await this.departmentRepo.findById(input.id);
    if (!department) return Result.fail('DEPARTMENT_NOT_FOUND');

    return Result.ok({
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      headId: department.headId,
      isActive: department.isActive,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    });
  }
}
