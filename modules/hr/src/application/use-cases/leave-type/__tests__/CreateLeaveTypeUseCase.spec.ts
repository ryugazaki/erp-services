import { CreateLeaveTypeUseCase } from '../CreateLeaveTypeUseCase';
import { MockLeaveTypeRepository } from '../../../../tests/mocks/MockLeaveTypeRepository';

describe('CreateLeaveTypeUseCase', () => {
  let useCase: CreateLeaveTypeUseCase;
  let leaveTypeRepo: MockLeaveTypeRepository;

  beforeEach(() => {
    leaveTypeRepo = new MockLeaveTypeRepository();
    useCase = new CreateLeaveTypeUseCase(leaveTypeRepo);
  });

  it('should create leave type successfully', async () => {
    const dto = {
      name: 'Annual Leave',
      code: 'ANNUAL',
      description: 'Annual leave days',
      defaultDays: 12,
      isPaid: true,
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.name).toBe('Annual Leave');
    expect(value.code).toBe('ANNUAL');
    expect(value.defaultDays).toBe(12);
    expect(value.isPaid).toBe(true);
    expect(value.isActive).toBe(true);
    expect(value.id).toBeDefined();
  });

  it('should fail if code already exists', async () => {
    const dto = {
      name: 'Annual Leave',
      code: 'ANNUAL',
      defaultDays: 12,
      isPaid: true,
    };
    await useCase.execute(dto);

    const result = await useCase.execute({
      name: 'Annual Leave 2',
      code: 'ANNUAL',
      defaultDays: 15,
      isPaid: true,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('LEAVE_TYPE_CODE_EXISTS');
  });
});
