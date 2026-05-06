import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IAttendanceRepository, AttendanceFilter, PaginationInput } from '../../../domain/repositories/IAttendanceRepository';
import { ListAttendancesDTO } from '../../dtos/attendance/ListAttendancesDTO';
import { TOKENS } from '../../tokens';

export interface ListAttendancesResult {
  items: Array<{
    id: string;
    employeeId: string;
    date: Date;
    clockedInAt: Date;
    clockedOutAt: Date | null;
    status: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@injectable()
export class ListAttendancesUseCase implements IUseCase<ListAttendancesDTO, Result<ListAttendancesResult>> {
  constructor(
    @inject(TOKENS.AttendanceRepository) private readonly attendanceRepo: IAttendanceRepository,
  ) {}

  async execute(dto: ListAttendancesDTO): Promise<Result<ListAttendancesResult>> {
    const filter: AttendanceFilter = {};
    if (dto.employeeId) filter.employeeId = dto.employeeId;
    if (dto.status) filter.status = dto.status;
    if (dto.dateFrom) filter.dateFrom = dto.dateFrom;
    if (dto.dateTo) filter.dateTo = dto.dateTo;

    const pagination: PaginationInput = {
      page: dto.page,
      limit: dto.limit,
    };

    const { items, meta } = await this.attendanceRepo.findAll(filter, pagination);

    return Result.ok({
      items: items.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        date: a.date,
        clockedInAt: a.clockedInAt,
        clockedOutAt: a.clockedOutAt,
        status: a.status,
      })),
      meta,
    });
  }
}
