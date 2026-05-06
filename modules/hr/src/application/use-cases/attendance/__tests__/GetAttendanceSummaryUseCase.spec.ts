import { GetAttendanceSummaryUseCase } from '../GetAttendanceSummaryUseCase';
import { MockAttendanceRepository } from '../../../../tests/mocks/MockAttendanceRepository';
import { Attendance } from '../../../../domain/entities/Attendance';

describe('GetAttendanceSummaryUseCase', () => {
  let useCase: GetAttendanceSummaryUseCase;
  let attendanceRepo: MockAttendanceRepository;

  beforeEach(() => {
    attendanceRepo = new MockAttendanceRepository();
    useCase = new GetAttendanceSummaryUseCase(attendanceRepo);
  });

  it('should return summary with data', async () => {
    const a1 = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 1),
      clockedInAt: new Date(2026, 0, 1, 8, 0),
    }).getValue();
    a1.pullEvents();
    a1.clockOut();
    a1.pullEvents();
    attendanceRepo.save(a1);

    const a2 = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 2),
      clockedInAt: new Date(2026, 0, 2, 8, 30),
    }).getValue();
    a2.pullEvents();
    attendanceRepo.save(a2);

    const result = await useCase.execute({
      employeeId: 'emp-1',
      month: 1,
      year: 2026,
    });

    expect(result.isSuccess()).toBe(true);
    const summary = result.getValue();
    expect(summary.totalDays).toBe(2);
    expect(summary.presentDays).toBe(2);
    expect(summary.clockedOutDays).toBe(1);
    expect(summary.totalWorkHours).toBeGreaterThan(0);
  });

  it('should return zeros for empty month', async () => {
    const result = await useCase.execute({
      employeeId: 'emp-1',
      month: 2,
      year: 2026,
    });

    expect(result.isSuccess()).toBe(true);
    const summary = result.getValue();
    expect(summary.totalDays).toBe(0);
    expect(summary.presentDays).toBe(0);
    expect(summary.totalWorkHours).toBe(0);
  });
});
