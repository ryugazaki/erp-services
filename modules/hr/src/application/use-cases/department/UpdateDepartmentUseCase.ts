import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { UpdateDepartmentDTO } from '../../dtos/department/UpdateDepartmentDTO';
import { TOKENS } from '../../tokens';

export interface UpdateDepartmentInput extends UpdateDepartmentDTO {
  id: string;
}

export interface UpdateDepartmentResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
}

@injectable()
export class UpdateDepartmentUseCase implements IUseCase<UpdateDepartmentInput, Result<UpdateDepartmentResult>> {
  constructor(
    @inject(TOKENS.DepartmentRepository) private readonly departmentRepo: IDepartmentRepository,
  ) {}

  async execute(input: UpdateDepartmentInput): Promise<Result<UpdateDepartmentResult>> {
    const department = await this.departmentRepo.findById(input.id);
    if (!department) return Result.fail('DEPARTMENT_NOT_FOUND');

    const result = department.updateDetails(input);
    if (result.isFailure()) return Result.fail(result.getError());

    await this.departmentRepo.update(department);

    return Result.ok({
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      headId: department.headId,
      isActive: department.isActive,
    });
  }
}
