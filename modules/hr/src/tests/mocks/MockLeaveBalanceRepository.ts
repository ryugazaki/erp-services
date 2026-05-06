import { LeaveBalance } from '../../domain/entities/LeaveBalance';
import { ILeaveBalanceRepository } from '../../domain/repositories/ILeaveBalanceRepository';

export class MockLeaveBalanceRepository implements ILeaveBalanceRepository {
  private balances: Map<string, LeaveBalance> = new Map();

  async findById(id: string): Promise<LeaveBalance | null> {
    return this.balances.get(id) ?? null;
  }

  async findByEmployeeAndTypeAndYear(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
    for (const b of this.balances.values()) {
      if (b.employeeId === employeeId && b.leaveTypeId === leaveTypeId && b.year === year) {
        return b;
      }
    }
    return null;
  }

  async findByEmployeeAndYear(employeeId: string, year: number): Promise<LeaveBalance[]> {
    const results: LeaveBalance[] = [];
    for (const b of this.balances.values()) {
      if (b.employeeId === employeeId && b.year === year) {
        results.push(b);
      }
    }
    return results;
  }

  async save(balance: LeaveBalance): Promise<void> {
    this.balances.set(balance.id, balance);
  }

  async update(balance: LeaveBalance): Promise<void> {
    this.balances.set(balance.id, balance);
  }
}
