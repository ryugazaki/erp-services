import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveTypeRepository } from '../../../domain/repositories/ILeaveTypeRepository';
import { TOKENS } from '../../tokens';

export interface ChangeLeaveTypeStatusInput {
  id: string;
  action: 'activate' | 'deactivate';
}

export interface ChangeLeaveTypeStatusResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
}

@injectable()
export class ChangeLeaveTypeStatusUseCase implements IUseCase<ChangeLeaveTypeStatusInput, Result<ChangeLeaveTypeStatusResult>> {
  constructor(
    @inject(TOKENS.LeaveTypeRepository) private readonly leaveTypeRepo: ILeaveTypeRepository,
  ) {}

  async execute(input: ChangeLeaveTypeStatusInput): Promise<Result<ChangeLeaveTypeStatusResult>> {
    const leaveType = await this.leaveTypeRepo.findById(input.id);
    if (!leaveType) return Result.fail('LEAVE_TYPE_NOT_FOUND');

    const result = input.action === 'activate' ? leaveType.activate() : leaveType.deactivate();
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
