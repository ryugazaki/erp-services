import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IAttendanceRepository, AttendanceMonthlySummary } from '../../../domain/repositories/IAttendanceRepository';
import { AttendanceSummaryDTO } from '../../dtos/attendance/AttendanceSummaryDTO';
import { TOKENS } from '../../tokens';

@injectable()
export class GetAttendanceSummaryUseCase implements IUseCase<AttendanceSummaryDTO, Result<AttendanceMonthlySummary>> {
  constructor(
    @inject(TOKENS.AttendanceRepository) private readonly attendanceRepo: IAttendanceRepository,
  ) {}

  async execute(dto: AttendanceSummaryDTO): Promise<Result<AttendanceMonthlySummary>> {
    const summary = await this.attendanceRepo.getMonthlySummary(dto.employeeId, dto.month, dto.year);
    return Result.ok(summary);
  }
}
