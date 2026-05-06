import { ApplyLeaveUseCase } from '../ApplyLeaveUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockLeaveTypeRepository } from '../../../../tests/mocks/MockLeaveTypeRepository';
import { MockLeaveBalanceRepository } from '../../../../tests/mocks/MockLeaveBalanceRepository';
import { MockLeaveRepository } from '../../../../tests/mocks/MockLeaveRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Employee } from '../../../../domain/entities/Employee';
import { LeaveType } from '../../../../domain/entities/LeaveType';
import { LeaveBalance } from '../../../../domain/entities/LeaveBalance';

describe('ApplyLeaveUseCase', () => {
  let useCase: ApplyLeaveUseCase;
  let employeeRepo: MockEmployeeRepository;
  let leaveTypeRepo: MockLeaveTypeRepository;
  let leaveBalanceRepo: MockLeaveBalanceRepository;
  let leaveRepo: MockLeaveRepository;
  let eventBus: MockEventBus;

  const employeeId = 'emp-1';
  const leaveTypeId = 'lt-1';

  beforeEach(async () => {
    employeeRepo = new MockEmployeeRepository();
    leaveTypeRepo = new MockLeaveTypeRepository();
    leaveBalanceRepo = new MockLeaveBalanceRepository();
    leaveRepo = new MockLeaveRepository();
    eventBus = new MockEventBus();
    useCase = new ApplyLeaveUseCase(employeeRepo, leaveTypeRepo, leaveBalanceRepo, leaveRepo, eventBus);

    const emp = Employee.reconstitute({
      id: employeeId,
      employeeNumber: 'EMP-00001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '',
      departmentId: null,
      position: null,
      hireDate: new Date('2026-01-01'),
      status: 'ACTIVE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await employeeRepo.save(emp);

    const leaveType = LeaveType.reconstitute({
      id: leaveTypeId,
      name: 'Annual Leave',
      code: 'ANNUAL',
      description: null,
      defaultDays: 12,
      isPaid: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await leaveTypeRepo.save(leaveType);
  });

  it('should apply leave successfully with status PENDING and balance deducted', async () => {
    const result = await useCase.execute({
      employeeId,
      leaveTypeId,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      reason: 'Vacation',
    });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.status).toBe('PENDING');
    expect(value.employeeId).toBe(employeeId);
    expect(value.leaveTypeId).toBe(leaveTypeId);
    expect(value.totalDays).toBe(3);
    expect(value.reason).toBe('Vacation');
    expect(value.id).toBeDefined();

    const balance = await leaveBalanceRepo.findByEmployeeAndTypeAndYear(employeeId, leaveTypeId, 2026);
    expect(balance).not.toBeNull();
    expect(balance!.usedDays).toBe(3);
    expect(balance!.remainingDays).toBe(9);
  });

  it('should fail if employee not found', async () => {
    const result = await useCase.execute({
      employeeId: 'nonexistent-emp',
      leaveTypeId,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      reason: 'Vacation',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_FOUND');
  });

  it('should fail if employee not ACTIVE', async () => {
    const inactiveEmp = Employee.reconstitute({
      id: 'emp-inactive',
      employeeNumber: 'EMP-00002',
      firstName: 'Inactive',
      lastName: 'User',
      email: 'inactive@test.com',
      phone: '',
      departmentId: null,
      position: null,
      hireDate: new Date('2026-01-01'),
      status: 'INACTIVE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await employeeRepo.save(inactiveEmp);

    const result = await useCase.execute({
      employeeId: 'emp-inactive',
      leaveTypeId,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      reason: 'Vacation',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_ACTIVE');
  });

  it('should fail if leave type not found', async () => {
    const result = await useCase.execute({
      employeeId,
      leaveTypeId: 'nonexistent-lt',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      reason: 'Vacation',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_NOT_FOUND');
  });

  it('should create new balance if not exists', async () => {
    const balanceBefore = await leaveBalanceRepo.findByEmployeeAndTypeAndYear(employeeId, leaveTypeId, 2026);
    expect(balanceBefore).toBeNull();

    const result = await useCase.execute({
      employeeId,
      leaveTypeId,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      reason: 'Vacation',
    });

    expect(result.isSuccess()).toBe(true);

    const balanceAfter = await leaveBalanceRepo.findByEmployeeAndTypeAndYear(employeeId, leaveTypeId, 2026);
    expect(balanceAfter).not.toBeNull();
    expect(balanceAfter!.totalDays).toBe(12);
    expect(balanceAfter!.usedDays).toBe(3);
    expect(balanceAfter!.remainingDays).toBe(9);
  });

  it('should fail if insufficient balance', async () => {
    const existingBalance = LeaveBalance.reconstitute({
      id: 'bal-1',
      employeeId,
      leaveTypeId,
      year: 2026,
      totalDays: 12,
      usedDays: 11,
      remainingDays: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await leaveBalanceRepo.save(existingBalance);

    const result = await useCase.execute({
      employeeId,
      leaveTypeId,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-05'),
      reason: 'Long vacation',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INSUFFICIENT_LEAVE_BALANCE');
  });
});
