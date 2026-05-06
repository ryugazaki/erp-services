import { LeaveType } from '../entities/LeaveType';

export interface ILeaveTypeRepository {
  findById(id: string): Promise<LeaveType | null>;
  findByCode(code: string): Promise<LeaveType | null>;
  findAll(): Promise<LeaveType[]>;
  save(leaveType: LeaveType): Promise<void>;
  update(leaveType: LeaveType): Promise<void>;
}
