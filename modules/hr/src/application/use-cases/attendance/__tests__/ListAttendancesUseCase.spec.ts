import { ListAttendancesUseCase } from '../ListAttendancesUseCase';
import { MockAttendanceRepository } from '../../../../tests/mocks/MockAttendanceRepository';
import { Attendance } from '../../../../domain/entities/Attendance';

describe('ListAttendancesUseCase', () => {
  let useCase: ListAttendancesUseCase;
  let attendanceRepo: MockAttendanceRepository;

  beforeEach(() => {
    attendanceRepo = new MockAttendanceRepository();
    useCase = new ListAttendancesUseCase(attendanceRepo);

    for (let i = 0; i < 5; i++) {
      const a = Attendance.create({
        employeeId: 'emp-1',
        date: new Date(2026, 0, i + 1),
        clockedInAt: new Date(2026, 0, i + 1, 8, 0),
      }).getValue();
      a.pullEvents();
      attendanceRepo.save(a);
    }

    const other = Attendance.create({
      employeeId: 'emp-2',
      date: new Date(2026, 0, 1),
      clockedInAt: new Date(2026, 0, 1, 9, 0),
    }).getValue();
    other.pullEvents();
    attendanceRepo.save(other);
  });

  it('should return paginated results', async () => {
    const result = await useCase.execute({ page: 1, limit: 3 });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().items.length).toBe(3);
    expect(result.getValue().meta.totalItems).toBe(6);
  });

  it('should filter by employeeId', async () => {
    const result = await useCase.execute({ page: 1, limit: 20, employeeId: 'emp-1' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().items.length).toBe(5);
    expect(result.getValue().items.every((a) => a.employeeId === 'emp-1')).toBe(true);
  });

  it('should filter by date range', async () => {
    const result = await useCase.execute({
      page: 1,
      limit: 20,
      dateFrom: new Date(2026, 0, 3),
      dateTo: new Date(2026, 0, 5),
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().items.length).toBe(3);
  });
});
