import { ChangeLeaveTypeStatusUseCase } from '../ChangeLeaveTypeStatusUseCase';
import { MockLeaveTypeRepository } from '../../../../tests/mocks/MockLeaveTypeRepository';
import { LeaveType } from '../../../../domain/entities/LeaveType';

describe('ChangeLeaveTypeStatusUseCase', () => {
  let useCase: ChangeLeaveTypeStatusUseCase;
  let leaveTypeRepo: MockLeaveTypeRepository;
  let leaveType: LeaveType;

  beforeEach(() => {
    leaveTypeRepo = new MockLeaveTypeRepository();
    useCase = new ChangeLeaveTypeStatusUseCase(leaveTypeRepo);

    leaveType = LeaveType.create({ name: 'Annual Leave', code: 'ANNUAL', defaultDays: 12 }).getValue();
    leaveTypeRepo.save(leaveType);
  });

  it('should deactivate an active leave type', async () => {
    const result = await useCase.execute({ id: leaveType.id, action: 'deactivate' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().isActive).toBe(false);
  });

  it('should activate an inactive leave type', async () => {
    leaveType.deactivate();
    await leaveTypeRepo.update(leaveType);

    const result = await useCase.execute({ id: leaveType.id, action: 'activate' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().isActive).toBe(true);
  });

  it('should fail if leave type not found', async () => {
    const result = await useCase.execute({ id: 'non-existent', action: 'deactivate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_NOT_FOUND');
  });

  it('should fail when deactivating an already inactive leave type', async () => {
    await useCase.execute({ id: leaveType.id, action: 'deactivate' });

    const result = await useCase.execute({ id: leaveType.id, action: 'deactivate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_ALREADY_INACTIVE');
  });

  it('should fail when activating an already active leave type', async () => {
    const result = await useCase.execute({ id: leaveType.id, action: 'activate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_ALREADY_ACTIVE');
  });

  it('should preserve other fields after status change', async () => {
    const result = await useCase.execute({ id: leaveType.id, action: 'deactivate' });

    expect(result.getValue().name).toBe('Annual Leave');
    expect(result.getValue().code).toBe('ANNUAL');
    expect(result.getValue().defaultDays).toBe(12);
  });
});
