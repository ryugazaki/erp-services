import { ListDepartmentsUseCase } from '../ListDepartmentsUseCase';
import { MockDepartmentRepository } from '../../../../tests/mocks/MockDepartmentRepository';
import { Department } from '../../../../domain/entities/Department';

describe('ListDepartmentsUseCase', () => {
  let useCase: ListDepartmentsUseCase;
  let departmentRepo: MockDepartmentRepository;

  beforeEach(async () => {
    departmentRepo = new MockDepartmentRepository();
    useCase = new ListDepartmentsUseCase(departmentRepo);

    const departments = [
      Department.create({ name: 'Engineering', code: 'ENG' }).getValue(),
      Department.create({ name: 'Marketing', code: 'MKT' }).getValue(),
      Department.create({ name: 'Human Resources', code: 'HR' }).getValue(),
    ];

    for (const dept of departments) {
      await departmentRepo.save(dept);
    }
  });

  it('should list all departments with pagination', async () => {
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.isSuccess()).toBe(true);
    const { items, meta } = result.getValue();
    expect(items).toHaveLength(3);
    expect(meta.totalItems).toBe(3);
  });

  it('should filter by search term', async () => {
    const result = await useCase.execute({ page: 1, limit: 10, search: 'eng' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().items).toHaveLength(1);
    expect(result.getValue().items[0].code).toBe('ENG');
  });

  it('should paginate correctly', async () => {
    const result = await useCase.execute({ page: 1, limit: 2 });

    expect(result.isSuccess()).toBe(true);
    const { items, meta } = result.getValue();
    expect(items).toHaveLength(2);
    expect(meta.totalPages).toBe(2);
    expect(meta.hasNextPage).toBe(true);
  });
});
