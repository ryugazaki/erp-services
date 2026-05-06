import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveRepository } from '../../../domain/repositories/ILeaveRepository';
import { TOKENS } from '../../tokens';

export interface GetLeaveInput {
  id: string;
}

export interface GetLeaveResult {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  remarks: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class GetLeaveUseCase implements IUseCase<GetLeaveInput, Result<GetLeaveResult>> {
  constructor(
    @inject(TOKENS.LeaveRepository) private readonly leaveRepo: ILeaveRepository,
  ) {}

  async execute(input: GetLeaveInput): Promise<Result<GetLeaveResult>> {
    const leave = await this.leaveRepo.findById(input.id);
    if (!leave) return Result.fail('LEAVE_NOT_FOUND');

    return Result.ok({
      id: leave.id,
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      reason: leave.reason,
      status: leave.status,
      approvedBy: leave.approvedBy,
      approvedAt: leave.approvedAt,
      remarks: leave.remarks,
      cancelledAt: leave.cancelledAt,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    });
  }
}
