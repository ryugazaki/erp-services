import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { ILeaveRepository } from '../../../domain/repositories/ILeaveRepository';
import { ILeaveTypeRepository } from '../../../domain/repositories/ILeaveTypeRepository';
import { ILeaveBalanceRepository } from '../../../domain/repositories/ILeaveBalanceRepository';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { Leave } from '../../../domain/entities/Leave';
import { LeaveBalance } from '../../../domain/entities/LeaveBalance';
import { ApplyLeaveDTO } from '../../dtos/leave/ApplyLeaveDTO';
import { TOKENS } from '../../tokens';

export interface ApplyLeaveResult {
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
export class ApplyLeaveUseCase implements IUseCase<ApplyLeaveDTO & { employeeId: string }, Result<ApplyLeaveResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
    @inject(TOKENS.LeaveTypeRepository) private readonly leaveTypeRepo: ILeaveTypeRepository,
    @inject(TOKENS.LeaveBalanceRepository) private readonly leaveBalanceRepo: ILeaveBalanceRepository,
    @inject(TOKENS.LeaveRepository) private readonly leaveRepo: ILeaveRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: ApplyLeaveDTO & { employeeId: string }): Promise<Result<ApplyLeaveResult>> {
    const employee = await this.employeeRepo.findById(dto.employeeId);
    if (!employee) return Result.fail('EMPLOYEE_NOT_FOUND');

    if (employee.status !== 'ACTIVE') return Result.fail('EMPLOYEE_NOT_ACTIVE');

    const leaveType = await this.leaveTypeRepo.findById(dto.leaveTypeId);
    if (!leaveType) return Result.fail('LEAVE_TYPE_NOT_FOUND');

    const totalDays = Math.ceil((dto.endDate.getTime() - dto.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const year = dto.startDate.getFullYear();

    let balance = await this.leaveBalanceRepo.findByEmployeeAndTypeAndYear(dto.employeeId, dto.leaveTypeId, year);

    if (!balance) {
      const balanceResult = LeaveBalance.create({
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        year,
        totalDays: leaveType.defaultDays,
      });

      if (balanceResult.isFailure()) return Result.fail(balanceResult.getError());

      balance = balanceResult.getValue();
      await this.leaveBalanceRepo.save(balance);
    }

    const useResult = balance.use(totalDays);
    if (useResult.isFailure()) return Result.fail(useResult.getError());

    const leaveResult = Leave.create({
      employeeId: dto.employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays,
      reason: dto.reason,
    });

    if (leaveResult.isFailure()) return Result.fail(leaveResult.getError());

    const leave = leaveResult.getValue();

    await this.leaveRepo.save(leave);

    await this.leaveBalanceRepo.update(balance);

    const leaveEvents = leave.pullEvents();
    const balanceEvents = balance.pullEvents();

    for (const event of [...leaveEvents, ...balanceEvents]) {
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
