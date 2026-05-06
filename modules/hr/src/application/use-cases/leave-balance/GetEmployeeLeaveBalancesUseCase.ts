import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { ILeaveBalanceRepository } from '../../../domain/repositories/ILeaveBalanceRepository';
import { TOKENS } from '../../tokens';

export interface GetEmployeeLeaveBalancesInput {
  employeeId: string;
  year?: number;
}

export interface LeaveBalanceResult {
  id: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

@injectable()
export class GetEmployeeLeaveBalancesUseCase implements IUseCase<GetEmployeeLeaveBalancesInput, Result<LeaveBalanceResult[]>> {
  constructor(
    @inject(TOKENS.LeaveBalanceRepository) private readonly leaveBalanceRepo: ILeaveBalanceRepository,
  ) {}

  async execute(input: GetEmployeeLeaveBalancesInput): Promise<Result<LeaveBalanceResult[]>> {
    const year = input.year ?? new Date().getFullYear();

    const balances = await this.leaveBalanceRepo.findByEmployeeAndYear(input.employeeId, year);

    const results: LeaveBalanceResult[] = balances.map((b) => ({
      id: b.id,
      leaveTypeId: b.leaveTypeId,
      year: b.year,
      totalDays: b.totalDays,
      usedDays: b.usedDays,
      remainingDays: b.remainingDays,
    }));

    return Result.ok(results);
  }
}
