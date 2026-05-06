import { GetDepartmentUseCase } from '../GetDepartmentUseCase';
import { MockDepartmentRepository } from '../../../../tests/mocks/MockDepartmentRepository';
import { Department } from '../../../../domain/entities/Department';

describe('GetDepartmentUseCase', () => {
  let useCase: GetDepartmentUseCase;
  let departmentRepo: MockDepartmentRepository;

  beforeEach(() => {
    departmentRepo = new MockDepartmentRepository();
    useCase = new GetDepartmentUseCase(departmentRepo);
  });

  it('should return department by id', async () => {
    const dept = Department.create({ name: 'Engineering', code: 'ENG' }).getValue();
    await departmentRepo.save(dept);

    const result = await useCase.execute({ id: dept.id });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().name).toBe('Engineering');
    expect(result.getValue().code).toBe('ENG');
  });

  it('should fail if department not found', async () => {
    const result = await useCase.execute({ id: 'non-existent-id' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_NOT_FOUND');
  });
});
