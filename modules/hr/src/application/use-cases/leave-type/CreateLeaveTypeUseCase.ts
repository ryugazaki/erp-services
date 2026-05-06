import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveTypeRepository } from '../../../domain/repositories/ILeaveTypeRepository';
import { LeaveType } from '../../../domain/entities/LeaveType';
import { CreateLeaveTypeDTO } from '../../dtos/leave-type/CreateLeaveTypeDTO';
import { TOKENS } from '../../tokens';

export interface CreateLeaveTypeResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
}

@injectable()
export class CreateLeaveTypeUseCase implements IUseCase<CreateLeaveTypeDTO, Result<CreateLeaveTypeResult>> {
  constructor(
    @inject(TOKENS.LeaveTypeRepository) private readonly leaveTypeRepo: ILeaveTypeRepository,
  ) {}

  async execute(dto: CreateLeaveTypeDTO): Promise<Result<CreateLeaveTypeResult>> {
    const existing = await this.leaveTypeRepo.findByCode(dto.code);
    if (existing) return Result.fail('LEAVE_TYPE_CODE_EXISTS');

    const leaveTypeResult = LeaveType.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      defaultDays: dto.defaultDays,
      isPaid: dto.isPaid,
    });

    if (leaveTypeResult.isFailure()) return Result.fail(leaveTypeResult.getError());

    const leaveType = leaveTypeResult.getValue();

    await this.leaveTypeRepo.save(leaveType);

    return Result.ok({
      id: leaveType.id,
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description,
      defaultDays: leaveType.defaultDays,
      isPaid: leaveType.isPaid,
      isActive: leaveType.isActive,
    });
  }
}
