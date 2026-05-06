import { ClockInUseCase } from '../ClockInUseCase';
import { MockAttendanceRepository } from '../../../../tests/mocks/MockAttendanceRepository';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Employee } from '../../../../domain/entities/Employee';

describe('ClockInUseCase', () => {
  let useCase: ClockInUseCase;
  let attendanceRepo: MockAttendanceRepository;
  let employeeRepo: MockEmployeeRepository;
  let eventBus: MockEventBus;
  let employee: Employee;

  beforeEach(() => {
    attendanceRepo = new MockAttendanceRepository();
    employeeRepo = new MockEmployeeRepository();
    eventBus = new MockEventBus();

    useCase = new ClockInUseCase(attendanceRepo, employeeRepo, eventBus);

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

  it('should clock in successfully', async () => {
    const result = await useCase.execute({ employeeId: employee.id });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().status).toBe('CLOCKED_IN');
    expect(result.getValue().clockedOutAt).toBeNull();
  });

  it('should fail if employee not found', async () => {
    const result = await useCase.execute({ employeeId: 'non-existent' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_FOUND');
  });

  it('should fail if employee is not active', async () => {
    employee.changeStatus('INACTIVE');
    await employeeRepo.update(employee);

    const result = await useCase.execute({ employeeId: employee.id });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_ACTIVE');
  });

  it('should fail if already clocked in today', async () => {
    await useCase.execute({ employeeId: employee.id });

    const result = await useCase.execute({ employeeId: employee.id });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ATTENDANCE_ALREADY_CLOCKED_IN');
  });

  it('should publish clocked-in event', async () => {
    await useCase.execute({ employeeId: employee.id });

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('hr.attendance.clocked-in');
  });
});
