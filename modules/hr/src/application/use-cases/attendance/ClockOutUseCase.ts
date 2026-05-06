import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IAttendanceRepository } from '../../../domain/repositories/IAttendanceRepository';
import { IEventBus } from '@erp/core/event-bus';
import { TOKENS } from '../../tokens';

export interface ClockOutInput {
  employeeId: string;
}

export interface ClockOutResult {
  id: string;
  employeeId: string;
  date: Date;
  clockedInAt: Date;
  clockedOutAt: Date;
  status: string;
}

@injectable()
export class ClockOutUseCase implements IUseCase<ClockOutInput, Result<ClockOutResult>> {
  constructor(
    @inject(TOKENS.AttendanceRepository) private readonly attendanceRepo: IAttendanceRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ClockOutInput): Promise<Result<ClockOutResult>> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const attendance = await this.attendanceRepo.findActiveByEmployeeForDate(input.employeeId, today);
    if (!attendance) return Result.fail('ATTENDANCE_NOT_CLOCKED_IN');

    const result = attendance.clockOut();
    if (result.isFailure()) return Result.fail(result.getError());

    await this.attendanceRepo.update(attendance);

    const events = attendance.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: attendance.id,
      employeeId: attendance.employeeId,
      date: attendance.date,
      clockedInAt: attendance.clockedInAt,
      clockedOutAt: attendance.clockedOutAt!,
      status: attendance.status,
    });
  }
}
