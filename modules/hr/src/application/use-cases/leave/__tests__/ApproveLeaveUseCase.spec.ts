import { ApproveLeaveUseCase } from '../ApproveLeaveUseCase';
import { MockLeaveRepository } from '../../../../tests/mocks/MockLeaveRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Leave } from '../../../../domain/entities/Leave';

describe('ApproveLeaveUseCase', () => {
  let useCase: ApproveLeaveUseCase;
  let leaveRepo: MockLeaveRepository;
  let eventBus: MockEventBus;

  beforeEach(async () => {
    leaveRepo = new MockLeaveRepository();
    eventBus = new MockEventBus();
    useCase = new ApproveLeaveUseCase(leaveRepo, eventBus);
  });

  it('should approve a PENDING leave', async () => {
    const leave = Leave.reconstitute({
      id: 'leave-1', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'),
      totalDays: 3, reason: 'test', status: 'PENDING',
      approvedBy: null, approvedAt: null, remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await leaveRepo.save(leave);

    const result = await useCase.execute({
      leaveId: 'leave-1',
      approvedBy: 'manager-1',
      remarks: 'Approved',
    });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.status).toBe('APPROVED');
    expect(value.approvedBy).toBe('manager-1');
    expect(value.remarks).toBe('Approved');
    expect(value.approvedAt).not.toBeNull();
    expect(value.id).toBe('leave-1');
  });

  it('should fail if leave not found', async () => {
    const result = await useCase.execute({
      leaveId: 'nonexistent-leave',
      approvedBy: 'manager-1',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_NOT_FOUND');
  });

  it('should fail if leave already processed', async () => {
    const leave = Leave.reconstitute({
      id: 'leave-2', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'),
      totalDays: 3, reason: 'test', status: 'APPROVED',
      approvedBy: 'manager-1', approvedAt: new Date(), remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await leaveRepo.save(leave);

    const result = await useCase.execute({
      leaveId: 'leave-2',
      approvedBy: 'manager-2',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_ALREADY_PROCESSED');
  });
});
