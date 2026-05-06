import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IAttendanceRepository } from '../../../domain/repositories/IAttendanceRepository';
import { TOKENS } from '../../tokens';

export interface GetAttendanceResult {
  id: string;
  employeeId: string;
  date: Date;
  clockedInAt: Date;
  clockedOutAt: Date | null;
  status: string;
}

@injectable()
export class GetAttendanceUseCase implements IUseCase<{ id: string }, Result<GetAttendanceResult>> {
  constructor(
    @inject(TOKENS.AttendanceRepository) private readonly attendanceRepo: IAttendanceRepository,
  ) {}

  async execute(input: { id: string }): Promise<Result<GetAttendanceResult>> {
    const attendance = await this.attendanceRepo.findById(input.id);
    if (!attendance) return Result.fail('ATTENDANCE_NOT_FOUND');

    return Result.ok({
      id: attendance.id,
      employeeId: attendance.employeeId,
      date: attendance.date,
      clockedInAt: attendance.clockedInAt,
      clockedOutAt: attendance.clockedOutAt,
      status: attendance.status,
    });
  }
}
