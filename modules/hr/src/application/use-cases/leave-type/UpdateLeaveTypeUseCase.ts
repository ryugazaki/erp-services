import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveTypeRepository } from '../../../domain/repositories/ILeaveTypeRepository';
import { TOKENS } from '../../tokens';

export interface UpdateLeaveTypeInput {
  id: string;
  name?: string;
  description?: string;
  defaultDays?: number;
  isPaid?: boolean;
}

export interface UpdateLeaveTypeResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
}

@injectable()
export class UpdateLeaveTypeUseCase implements IUseCase<UpdateLeaveTypeInput, Result<UpdateLeaveTypeResult>> {
  constructor(
    @inject(TOKENS.LeaveTypeRepository) private readonly leaveTypeRepo: ILeaveTypeRepository,
  ) {}

  async execute(input: UpdateLeaveTypeInput): Promise<Result<UpdateLeaveTypeResult>> {
    const leaveType = await this.leaveTypeRepo.findById(input.id);
    if (!leaveType) return Result.fail('LEAVE_TYPE_NOT_FOUND');

    const result = leaveType.update({
      name: input.name,
      description: input.description,
      defaultDays: input.defaultDays,
      isPaid: input.isPaid,
    });

    if (result.isFailure()) return Result.fail(result.getError());

    await this.leaveTypeRepo.update(leaveType);

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
