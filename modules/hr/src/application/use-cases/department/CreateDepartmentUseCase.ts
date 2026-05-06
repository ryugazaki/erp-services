import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IDepartmentRepository } from '../../../domain/repositories/IDepartmentRepository';
import { Department } from '../../../domain/entities/Department';
import { CreateDepartmentDTO } from '../../dtos/department/CreateDepartmentDTO';
import { TOKENS } from '../../tokens';

export interface CreateDepartmentResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
}

@injectable()
export class CreateDepartmentUseCase implements IUseCase<CreateDepartmentDTO, Result<CreateDepartmentResult>> {
  constructor(
    @inject(TOKENS.DepartmentRepository) private readonly departmentRepo: IDepartmentRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateDepartmentDTO): Promise<Result<CreateDepartmentResult>> {
    const existing = await this.departmentRepo.findByCode(dto.code);
    if (existing) return Result.fail('DEPARTMENT_CODE_EXISTS');

    const result = Department.create(dto);

    if (result.isFailure()) return Result.fail(result.getError());

    const department = result.getValue();

    await this.departmentRepo.save(department);

    const events = department.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

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
