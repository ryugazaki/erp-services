import { UpdateLeaveTypeUseCase } from '../UpdateLeaveTypeUseCase';
import { MockLeaveTypeRepository } from '../../../../tests/mocks/MockLeaveTypeRepository';
import { LeaveType } from '../../../../domain/entities/LeaveType';

describe('UpdateLeaveTypeUseCase', () => {
  let useCase: UpdateLeaveTypeUseCase;
  let leaveTypeRepo: MockLeaveTypeRepository;
  let leaveType: LeaveType;

  beforeEach(() => {
    leaveTypeRepo = new MockLeaveTypeRepository();
    useCase = new UpdateLeaveTypeUseCase(leaveTypeRepo);

    leaveType = LeaveType.create({ name: 'Annual Leave', code: 'ANNUAL', defaultDays: 12 }).getValue();
    leaveTypeRepo.save(leaveType);
  });

  it('should update leave type name', async () => {
    const result = await useCase.execute({ id: leaveType.id, name: 'Annual Leave Updated' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('Annual Leave Updated');
  });

  it('should update multiple fields', async () => {
    const result = await useCase.execute({
      id: leaveType.id,
      name: 'Vacation',
      description: 'Paid vacation days',
      defaultDays: 15,
      isPaid: false,
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('Vacation');
    expect(result.getValue().description).toBe('Paid vacation days');
    expect(result.getValue().defaultDays).toBe(15);
    expect(result.getValue().isPaid).toBe(false);
  });

  it('should preserve code and isActive when updating', async () => {
    const result = await useCase.execute({ id: leaveType.id, name: 'Updated' });

    expect(result.getValue().code).toBe('ANNUAL');
    expect(result.getValue().isActive).toBe(true);
  });

  it('should fail if leave type not found', async () => {
    const result = await useCase.execute({ id: 'non-existent', name: 'Test' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_NOT_FOUND');
  });

  it('should fail when setting empty name', async () => {
    const result = await useCase.execute({ id: leaveType.id, name: '' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_NAME_REQUIRED');
  });

  it('should fail when setting negative defaultDays', async () => {
    const result = await useCase.execute({ id: leaveType.id, defaultDays: -1 });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_INVALID_DAYS');
  });
});
