import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveTypeRepository } from '../../../domain/repositories/ILeaveTypeRepository';
import { TOKENS } from '../../tokens';

export interface LeaveTypeItemResult {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
}

@injectable()
export class ListLeaveTypesUseCase implements IUseCase<void, Result<LeaveTypeItemResult[]>> {
  constructor(
    @inject(TOKENS.LeaveTypeRepository) private readonly leaveTypeRepo: ILeaveTypeRepository,
  ) {}

  async execute(): Promise<Result<LeaveTypeItemResult[]>> {
    const leaveTypes = await this.leaveTypeRepo.findAll();

    const results: LeaveTypeItemResult[] = leaveTypes.map((lt) => ({
      id: lt.id,
      name: lt.name,
      code: lt.code,
      description: lt.description,
      defaultDays: lt.defaultDays,
      isPaid: lt.isPaid,
      isActive: lt.isActive,
    }));

    return Result.ok(results);
  }
}
