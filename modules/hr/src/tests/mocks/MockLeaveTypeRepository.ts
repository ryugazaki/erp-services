import { LeaveType } from '../../domain/entities/LeaveType';
import { ILeaveTypeRepository } from '../../domain/repositories/ILeaveTypeRepository';

export class MockLeaveTypeRepository implements ILeaveTypeRepository {
  private leaveTypes: Map<string, LeaveType> = new Map();

  async findById(id: string): Promise<LeaveType | null> {
    return this.leaveTypes.get(id) ?? null;
  }

  async findByCode(code: string): Promise<LeaveType | null> {
    for (const lt of this.leaveTypes.values()) {
      if (lt.code === code) return lt;
    }
    return null;
  }

  async findAll(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }

  async save(leaveType: LeaveType): Promise<void> {
    this.leaveTypes.set(leaveType.id, leaveType);
  }

  async update(leaveType: LeaveType): Promise<void> {
    this.leaveTypes.set(leaveType.id, leaveType);
  }
}
