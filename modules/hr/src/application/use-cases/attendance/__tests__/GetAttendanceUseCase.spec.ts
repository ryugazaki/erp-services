import { GetAttendanceUseCase } from '../GetAttendanceUseCase';
import { MockAttendanceRepository } from '../../../../tests/mocks/MockAttendanceRepository';
import { Attendance } from '../../../../domain/entities/Attendance';

describe('GetAttendanceUseCase', () => {
  let useCase: GetAttendanceUseCase;
  let attendanceRepo: MockAttendanceRepository;
  let attendance: Attendance;

  beforeEach(() => {
    attendanceRepo = new MockAttendanceRepository();
    useCase = new GetAttendanceUseCase(attendanceRepo);

    attendance = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(2026, 0, 15, 8, 0),
    }).getValue();
    attendance.pullEvents();
    attendanceRepo.save(attendance);
  });

  it('should return attendance when found', async () => {
    const result = await useCase.execute({ id: attendance.id });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().id).toBe(attendance.id);
    expect(result.getValue().employeeId).toBe('emp-1');
  });

  it('should fail if attendance not found', async () => {
    const result = await useCase.execute({ id: 'non-existent' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ATTENDANCE_NOT_FOUND');
  });
});
