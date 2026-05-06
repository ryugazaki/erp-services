import { ClockOutUseCase } from '../ClockOutUseCase';
import { ClockInUseCase } from '../ClockInUseCase';
import { MockAttendanceRepository } from '../../../../tests/mocks/MockAttendanceRepository';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Employee } from '../../../../domain/entities/Employee';

describe('ClockOutUseCase', () => {
  let clockOutUseCase: ClockOutUseCase;
  let clockInUseCase: ClockInUseCase;
  let attendanceRepo: MockAttendanceRepository;
  let employeeRepo: MockEmployeeRepository;
  let eventBus: MockEventBus;
  let employee: Employee;

  beforeEach(() => {
    attendanceRepo = new MockAttendanceRepository();
    employeeRepo = new MockEmployeeRepository();
    eventBus = new MockEventBus();

    clockOutUseCase = new ClockOutUseCase(attendanceRepo, eventBus);
    clockInUseCase = new ClockInUseCase(attendanceRepo, employeeRepo, eventBus);

    employee = Employee.create({
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      hireDate: new Date(),
    }).getValue();
    employee.pullEvents();
    employeeRepo.save(employee);
  });

  it('should clock out successfully', async () => {
    await clockInUseCase.execute({ employeeId: employee.id });
    eventBus.publishedEvents = [];

    const result = await clockOutUseCase.execute({ employeeId: employee.id });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().status).toBe('CLOCKED_OUT');
    expect(result.getValue().clockedOutAt).not.toBeNull();
  });

  it('should fail if not clocked in today', async () => {
    const result = await clockOutUseCase.execute({ employeeId: employee.id });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ATTENDANCE_NOT_CLOCKED_IN');
  });

  it('should fail if already clocked out', async () => {
    await clockInUseCase.execute({ employeeId: employee.id });
    await clockOutUseCase.execute({ employeeId: employee.id });

    const result = await clockOutUseCase.execute({ employeeId: employee.id });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ATTENDANCE_ALREADY_CLOCKED_OUT');
  });

  it('should publish clocked-out event', async () => {
    await clockInUseCase.execute({ employeeId: employee.id });
    eventBus.publishedEvents = [];

    await clockOutUseCase.execute({ employeeId: employee.id });

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('hr.attendance.clocked-out');
  });
});
