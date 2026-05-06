import { UpdateDepartmentUseCase } from '../UpdateDepartmentUseCase';
import { MockDepartmentRepository } from '../../../../tests/mocks/MockDepartmentRepository';
import { Department } from '../../../../domain/entities/Department';

describe('UpdateDepartmentUseCase', () => {
  let useCase: UpdateDepartmentUseCase;
  let departmentRepo: MockDepartmentRepository;

  beforeEach(async () => {
    departmentRepo = new MockDepartmentRepository();
    useCase = new UpdateDepartmentUseCase(departmentRepo);
  });

  it('should update department name and description', async () => {
    const dept = Department.create({ name: 'Engineering', code: 'ENG' }).getValue();
    await departmentRepo.save(dept);

    const result = await useCase.execute({
      id: dept.id,
      name: 'Engineering & QA',
      description: 'Updated description',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('Engineering & QA');
    expect(result.getValue().description).toBe('Updated description');
    expect(result.getValue().code).toBe('ENG');
  });

  it('should update headId', async () => {
    const dept = Department.create({ name: 'Engineering', code: 'ENG' }).getValue();
    await departmentRepo.save(dept);

    const result = await useCase.execute({
      id: dept.id,
      headId: 'emp-123',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().headId).toBe('emp-123');
  });

  it('should fail if department not found', async () => {
    const result = await useCase.execute({
      id: 'non-existent',
      name: 'Test',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_NOT_FOUND');
  });

  it('should fail with empty name', async () => {
    const dept = Department.create({ name: 'Engineering', code: 'ENG' }).getValue();
    await departmentRepo.save(dept);

    const result = await useCase.execute({
      id: dept.id,
      name: '',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_NAME_REQUIRED');
  });
});
