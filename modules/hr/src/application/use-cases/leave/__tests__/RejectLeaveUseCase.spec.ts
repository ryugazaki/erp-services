import { RejectLeaveUseCase } from '../RejectLeaveUseCase';
import { MockLeaveRepository } from '../../../../tests/mocks/MockLeaveRepository';
import { MockLeaveBalanceRepository } from '../../../../tests/mocks/MockLeaveBalanceRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Leave } from '../../../../domain/entities/Leave';
import { LeaveBalance } from '../../../../domain/entities/LeaveBalance';

describe('RejectLeaveUseCase', () => {
  let useCase: RejectLeaveUseCase;
  let leaveRepo: MockLeaveRepository;
  let leaveBalanceRepo: MockLeaveBalanceRepository;
  let eventBus: MockEventBus;

  beforeEach(async () => {
    leaveRepo = new MockLeaveRepository();
    leaveBalanceRepo = new MockLeaveBalanceRepository();
    eventBus = new MockEventBus();
    useCase = new RejectLeaveUseCase(leaveRepo, leaveBalanceRepo, eventBus);
  });

  it('should reject a PENDING leave and restore balance', async () => {
    const leave = Leave.reconstitute({
      id: 'leave-1', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'),
      totalDays: 3, reason: 'test', status: 'PENDING',
      approvedBy: null, approvedAt: null, remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await leaveRepo.save(leave);

    const balance = LeaveBalance.reconstitute({
      id: 'bal-1', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      year: 2026, totalDays: 12, usedDays: 3, remainingDays: 9,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await leaveBalanceRepo.save(balance);

    const result = await useCase.execute({
      leaveId: 'leave-1',
      rejectedBy: 'manager-1',
      remarks: 'Not allowed',
    });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.status).toBe('REJECTED');
    expect(value.approvedBy).toBe('manager-1');
    expect(value.remarks).toBe('Not allowed');

    const updatedBalance = await leaveBalanceRepo.findByEmployeeAndTypeAndYear('emp-1', 'lt-1', 2026);
    expect(updatedBalance!.usedDays).toBe(0);
    expect(updatedBalance!.remainingDays).toBe(12);
  });

  it('should fail if leave not found', async () => {
    const result = await useCase.execute({
      leaveId: 'nonexistent-leave',
      rejectedBy: 'manager-1',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_NOT_FOUND');
  });

  it('should fail if leave already processed', async () => {
    const leave = Leave.reconstitute({
      id: 'leave-2', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'),
      totalDays: 3, reason: 'test', status: 'REJECTED',
      approvedBy: 'manager-1', approvedAt: new Date(), remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await leaveRepo.save(leave);

    const result = await useCase.execute({
      leaveId: 'leave-2',
      rejectedBy: 'manager-2',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_ALREADY_PROCESSED');
  });
});
