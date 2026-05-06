import { ListLeaveTypesUseCase } from '../ListLeaveTypesUseCase';
import { MockLeaveTypeRepository } from '../../../../tests/mocks/MockLeaveTypeRepository';
import { LeaveType } from '../../../../domain/entities/LeaveType';

describe('ListLeaveTypesUseCase', () => {
  let useCase: ListLeaveTypesUseCase;
  let leaveTypeRepo: MockLeaveTypeRepository;

  beforeEach(async () => {
    leaveTypeRepo = new MockLeaveTypeRepository();
    useCase = new ListLeaveTypesUseCase(leaveTypeRepo);

    const lt1 = LeaveType.reconstitute({
      id: 'lt-1', name: 'Annual Leave', code: 'ANNUAL', description: null,
      defaultDays: 12, isPaid: true, isActive: true, createdAt: new Date(), updatedAt: new Date(),
    });
    const lt2 = LeaveType.reconstitute({
      id: 'lt-2', name: 'Sick Leave', code: 'SICK', description: null,
      defaultDays: 10, isPaid: true, isActive: true, createdAt: new Date(), updatedAt: new Date(),
    });

    await leaveTypeRepo.save(lt1);
    await leaveTypeRepo.save(lt2);
  });

  it('should return all leave types', async () => {
    const result = await useCase.execute();

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.length).toBe(2);
    expect(value[0].name).toBe('Annual Leave');
    expect(value[1].name).toBe('Sick Leave');
  });

  it('should return empty array when none exist', async () => {
    const emptyRepo = new MockLeaveTypeRepository();
    const emptyUseCase = new ListLeaveTypesUseCase(emptyRepo);

    const result = await emptyUseCase.execute();

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toEqual([]);
  });
});
