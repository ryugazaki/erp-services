import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IAttendanceRepository } from '../../../domain/repositories/IAttendanceRepository';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { IEventBus } from '@erp/core/event-bus';
import { Attendance } from '../../../domain/entities/Attendance';
import { TOKENS } from '../../tokens';

export interface ClockInInput {
  employeeId: string;
}

export interface ClockInResult {
  id: string;
  employeeId: string;
  date: Date;
  clockedInAt: Date;
  clockedOutAt: Date | null;
  status: string;
}

@injectable()
export class ClockInUseCase implements IUseCase<ClockInInput, Result<ClockInResult>> {
  constructor(
    @inject(TOKENS.AttendanceRepository) private readonly attendanceRepo: IAttendanceRepository,
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ClockInInput): Promise<Result<ClockInResult>> {
    const employee = await this.employeeRepo.findById(input.employeeId);
    if (!employee) return Result.fail('EMPLOYEE_NOT_FOUND');
    if (employee.status !== 'ACTIVE') return Result.fail('EMPLOYEE_NOT_ACTIVE');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await this.attendanceRepo.findActiveByEmployeeForDate(input.employeeId, today);
    if (existing) return Result.fail('ATTENDANCE_ALREADY_CLOCKED_IN');

    const result = Attendance.create({
      employeeId: input.employeeId,
      date: today,
      clockedInAt: now,
    });

    if (result.isFailure()) return Result.fail(result.getError());

    const attendance = result.getValue();
    await this.attendanceRepo.save(attendance);

    const events = attendance.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

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
