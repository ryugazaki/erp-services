import { ListLeavesUseCase } from '../ListLeavesUseCase';
import { MockLeaveRepository } from '../../../../tests/mocks/MockLeaveRepository';
import { Leave } from '../../../../domain/entities/Leave';

describe('ListLeavesUseCase', () => {
  let useCase: ListLeavesUseCase;
  let leaveRepo: MockLeaveRepository;

  beforeEach(async () => {
    leaveRepo = new MockLeaveRepository();
    useCase = new ListLeavesUseCase(leaveRepo);

    const leave1 = Leave.reconstitute({
      id: 'leave-1', employeeId: 'emp-1', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-06-03'),
      totalDays: 3, reason: 'vacation', status: 'PENDING',
      approvedBy: null, approvedAt: null, remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const leave2 = Leave.reconstitute({
      id: 'leave-2', employeeId: 'emp-2', leaveTypeId: 'lt-1',
      startDate: new Date('2026-06-10'), endDate: new Date('2026-06-12'),
      totalDays: 3, reason: 'sick', status: 'APPROVED',
      approvedBy: 'mgr-1', approvedAt: new Date(), remarks: null, cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const leave3 = Leave.reconstitute({
      id: 'leave-3', employeeId: 'emp-1', leaveTypeId: 'lt-2',
      startDate: new Date('2026-07-01'), endDate: new Date('2026-07-02'),
      totalDays: 2, reason: 'personal', status: 'REJECTED',
      approvedBy: 'mgr-1', approvedAt: new Date(), remarks: 'denied', cancelledAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    });

    await leaveRepo.save(leave1);
    await leaveRepo.save(leave2);
    await leaveRepo.save(leave3);
  });

  it('should return paginated result', async () => {
    const result = await useCase.execute({ page: 1, limit: 2 });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(2);
    expect(value.meta.totalItems).toBe(3);
    expect(value.meta.page).toBe(1);
    expect(value.meta.limit).toBe(2);
    expect(value.meta.totalPages).toBe(2);
  });

  it('should filter by employeeId', async () => {
    const result = await useCase.execute({ page: 1, limit: 10, employeeId: 'emp-1' });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(2);
    expect(value.items.every((l) => l.employeeId === 'emp-1')).toBe(true);
  });

  it('should filter by status', async () => {
    const result = await useCase.execute({ page: 1, limit: 10, status: 'APPROVED' });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(1);
    expect(value.items[0].status).toBe('APPROVED');
  });
});
