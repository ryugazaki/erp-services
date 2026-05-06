import { inject, injectable } from 'tsyringe';
import { IUseCase, Result, PaginatedResult } from '@erp/shared/kernel';
import { ILeaveRepository, LeaveFilter, PaginationInput } from '../../../domain/repositories/ILeaveRepository';
import { ListLeavesDTO } from '../../dtos/leave/ListLeavesDTO';
import { TOKENS } from '../../tokens';

export interface LeaveItemResult {
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

export interface ListLeavesResult {
  items: LeaveItemResult[];
  meta: PaginatedResult<unknown>['meta'];
}

@injectable()
export class ListLeavesUseCase implements IUseCase<ListLeavesDTO, Result<ListLeavesResult>> {
  constructor(
    @inject(TOKENS.LeaveRepository) private readonly leaveRepo: ILeaveRepository,
  ) {}

  async execute(dto: ListLeavesDTO): Promise<Result<ListLeavesResult>> {
    const filter: LeaveFilter = {
      employeeId: dto.employeeId,
      status: dto.status,
      startDateFrom: dto.startDateFrom,
      startDateTo: dto.startDateTo,
    };

    const pagination: PaginationInput = {
      page: dto.page,
      limit: dto.limit,
    };

    const paginatedResult = await this.leaveRepo.findAll(filter, pagination);

    const items: LeaveItemResult[] = paginatedResult.items.map((leave) => ({
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
    }));

    return Result.ok({ items, meta: paginatedResult.meta });
  }
}
