import { GetEmployeeLeaveBalancesUseCase } from '../GetEmployeeLeaveBalancesUseCase';
import { MockLeaveBalanceRepository } from '../../../../tests/mocks/MockLeaveBalanceRepository';
import { LeaveBalance } from '../../../../domain/entities/LeaveBalance';

describe('GetEmployeeLeaveBalancesUseCase', () => {
  let useCase: GetEmployeeLeaveBalancesUseCase;
  let leaveBalanceRepo: MockLeaveBalanceRepository;

  beforeEach(() => {
    leaveBalanceRepo = new MockLeaveBalanceRepository();
    useCase = new GetEmployeeLeaveBalancesUseCase(leaveBalanceRepo);
  });

  it('should return leave balances for an employee', async () => {
    const employeeId = 'emp-001';
    const year = 2026;

    const balance1 = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-001', year, totalDays: 12 }).getValue();
    const balance2 = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-002', year, totalDays: 10 }).getValue();

    await leaveBalanceRepo.save(balance1);
    await leaveBalanceRepo.save(balance2);

    const result = await useCase.execute({ employeeId, year });

    expect(result.isSuccess()).toBe(true);
    const balances = result.getValue();
    expect(balances).toHaveLength(2);
    expect(balances[0].totalDays).toBe(12);
    expect(balances[1].totalDays).toBe(10);
  });

  it('should return empty array when no balances exist', async () => {
    const result = await useCase.execute({ employeeId: 'emp-999', year: 2026 });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toHaveLength(0);
  });

  it('should default to current year if year not provided', async () => {
    const employeeId = 'emp-001';
    const currentYear = new Date().getFullYear();

    const balance = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-001', year: currentYear, totalDays: 12 }).getValue();
    await leaveBalanceRepo.save(balance);

    const result = await useCase.execute({ employeeId });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toHaveLength(1);
    expect(result.getValue()[0].year).toBe(currentYear);
  });

  it('should not return balances from other years', async () => {
    const employeeId = 'emp-001';

    const balance2025 = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-001', year: 2025, totalDays: 12 }).getValue();
    const balance2026 = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-001', year: 2026, totalDays: 12 }).getValue();

    await leaveBalanceRepo.save(balance2025);
    await leaveBalanceRepo.save(balance2026);

    const result = await useCase.execute({ employeeId, year: 2026 });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toHaveLength(1);
    expect(result.getValue()[0].year).toBe(2026);
  });

  it('should map all balance fields correctly', async () => {
    const employeeId = 'emp-001';
    const balance = LeaveBalance.create({ employeeId, leaveTypeId: 'lt-001', year: 2026, totalDays: 12 }).getValue();
    await leaveBalanceRepo.save(balance);

    const result = await useCase.execute({ employeeId, year: 2026 });

    const b = result.getValue()[0];
    expect(b.id).toBe(balance.id);
    expect(b.leaveTypeId).toBe('lt-001');
    expect(b.year).toBe(2026);
    expect(b.totalDays).toBe(12);
    expect(b.usedDays).toBe(0);
    expect(b.remainingDays).toBe(12);
  });
});
