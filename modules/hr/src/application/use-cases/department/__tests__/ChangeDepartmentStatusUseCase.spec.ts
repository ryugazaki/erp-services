import { ChangeDepartmentStatusUseCase } from '../ChangeDepartmentStatusUseCase';
import { MockDepartmentRepository } from '../../../../tests/mocks/MockDepartmentRepository';
import { Department } from '../../../../domain/entities/Department';

describe('ChangeDepartmentStatusUseCase', () => {
  let useCase: ChangeDepartmentStatusUseCase;
  let departmentRepo: MockDepartmentRepository;
  let department: Department;

  beforeEach(() => {
    departmentRepo = new MockDepartmentRepository();
    useCase = new ChangeDepartmentStatusUseCase(departmentRepo);

    department = Department.create({ name: 'Engineering', code: 'ENG' }).getValue();
    department.pullEvents();
    departmentRepo.save(department);
  });

  it('should deactivate an active department', async () => {
    const result = await useCase.execute({ id: department.id, action: 'deactivate' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().isActive).toBe(false);
  });

  it('should activate an inactive department', async () => {
    department.deactivate();
    await departmentRepo.update(department);

    const result = await useCase.execute({ id: department.id, action: 'activate' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().isActive).toBe(true);
  });

  it('should fail if department not found', async () => {
    const result = await useCase.execute({ id: 'non-existent', action: 'deactivate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_NOT_FOUND');
  });

  it('should fail when deactivating an already inactive department', async () => {
    await useCase.execute({ id: department.id, action: 'deactivate' });

    const result = await useCase.execute({ id: department.id, action: 'deactivate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_ALREADY_INACTIVE');
  });

  it('should fail when activating an already active department', async () => {
    const result = await useCase.execute({ id: department.id, action: 'activate' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_ALREADY_ACTIVE');
  });

  it('should preserve other fields after status change', async () => {
    const result = await useCase.execute({ id: department.id, action: 'deactivate' });

    expect(result.getValue().name).toBe('Engineering');
    expect(result.getValue().code).toBe('ENG');
  });
});
