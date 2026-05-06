import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { ILeaveRepository } from '../../../domain/repositories/ILeaveRepository';
import { ILeaveBalanceRepository } from '../../../domain/repositories/ILeaveBalanceRepository';
import { TOKENS } from '../../tokens';

export interface CancelLeaveResult {
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
export class CancelLeaveUseCase implements IUseCase<{ leaveId: string }, Result<CancelLeaveResult>> {
  constructor(
    @inject(TOKENS.LeaveRepository) private readonly leaveRepo: ILeaveRepository,
    @inject(TOKENS.LeaveBalanceRepository) private readonly leaveBalanceRepo: ILeaveBalanceRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: { leaveId: string }): Promise<Result<CancelLeaveResult>> {
    const leave = await this.leaveRepo.findById(dto.leaveId);
    if (!leave) return Result.fail('LEAVE_NOT_FOUND');

    const cancelResult = leave.cancel();
    if (cancelResult.isFailure()) return Result.fail(cancelResult.getError());

    const year = leave.startDate.getFullYear();
    const balance = await this.leaveBalanceRepo.findByEmployeeAndTypeAndYear(leave.employeeId, leave.leaveTypeId, year);

    if (balance) {
      balance.restore(leave.totalDays);
      await this.leaveBalanceRepo.update(balance);

      const balanceEvents = balance.pullEvents();
      for (const event of balanceEvents) {
        await this.eventBus.publish(event);
      }
    }

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
