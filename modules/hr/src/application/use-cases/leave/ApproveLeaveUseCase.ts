import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { ILeaveRepository } from '../../../domain/repositories/ILeaveRepository';
import { ReviewLeaveDTO } from '../../dtos/leave/ReviewLeaveDTO';
import { TOKENS } from '../../tokens';

export interface ApproveLeaveResult {
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
}

@injectable()
export class ApproveLeaveUseCase implements IUseCase<ReviewLeaveDTO & { leaveId: string; approvedBy: string }, Result<ApproveLeaveResult>> {
  constructor(
    @inject(TOKENS.LeaveRepository) private readonly leaveRepo: ILeaveRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: ReviewLeaveDTO & { leaveId: string; approvedBy: string }): Promise<Result<ApproveLeaveResult>> {
    const leave = await this.leaveRepo.findById(dto.leaveId);
    if (!leave) return Result.fail('LEAVE_NOT_FOUND');

    const approveResult = leave.approve(dto.approvedBy, dto.remarks);
    if (approveResult.isFailure()) return Result.fail(approveResult.getError());

    await this.leaveRepo.update(leave);

    const events = leave.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

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
    });
  }
}
