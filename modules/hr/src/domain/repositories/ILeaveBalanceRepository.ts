import { LeaveBalance } from '../entities/LeaveBalance';

export interface ILeaveBalanceRepository {
  findById(id: string): Promise<LeaveBalance | null>;
  findByEmployeeAndTypeAndYear(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null>;
  findByEmployeeAndYear(employeeId: string, year: number): Promise<LeaveBalance[]>;
  save(balance: LeaveBalance): Promise<void>;
  update(balance: LeaveBalance): Promise<void>;
}
