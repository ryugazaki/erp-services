import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { TOKENS } from '../../tokens';

export interface ChangeDepartmentStatusInput {
  id: string;
  action: 'activate' | 'deactivate';
}

export interface ChangeDepartmentStatusResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
}

@injectable()
export class ChangeDepartmentStatusUseCase implements IUseCase<ChangeDepartmentStatusInput, Result<ChangeDepartmentStatusResult>> {
  constructor(
    @inject(TOKENS.DepartmentRepository) private readonly departmentRepo: IDepartmentRepository,
  ) {}

  async execute(input: ChangeDepartmentStatusInput): Promise<Result<ChangeDepartmentStatusResult>> {
    const department = await this.departmentRepo.findById(input.id);
    if (!department) return Result.fail('DEPARTMENT_NOT_FOUND');

    const result = input.action === 'activate' ? department.activate() : department.deactivate();
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
