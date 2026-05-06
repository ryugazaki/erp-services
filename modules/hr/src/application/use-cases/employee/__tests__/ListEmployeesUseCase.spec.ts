import { ListEmployeesUseCase } from '../ListEmployeesUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { Employee } from '../../../../domain/entities/Employee';

describe('ListEmployeesUseCase', () => {
  let useCase: ListEmployeesUseCase;
  let employeeRepo: MockEmployeeRepository;

  beforeEach(async () => {
    employeeRepo = new MockEmployeeRepository();
    useCase = new ListEmployeesUseCase(employeeRepo);

    const emp1 = Employee.reconstitute({
      id: 'uuid1', employeeNumber: 'EMP-00001', firstName: 'John', lastName: 'Doe',
      email: 'john@test.com', phone: '', departmentId: null, position: null,
      hireDate: new Date(), status: 'ACTIVE', userId: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const emp2 = Employee.reconstitute({
      id: 'uuid2', employeeNumber: 'EMP-00002', firstName: 'Jane', lastName: 'Smith',
      email: 'jane@test.com', phone: '', departmentId: null, position: null,
      hireDate: new Date(), status: 'INACTIVE', userId: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const emp3 = Employee.reconstitute({
      id: 'uuid3', employeeNumber: 'EMP-00003', firstName: 'Bob', lastName: 'Johnson',
      email: 'bob@test.com', phone: '', departmentId: null, position: null,
      hireDate: new Date(), status: 'ACTIVE', userId: null, createdAt: new Date(), updatedAt: new Date(),
    });

    await employeeRepo.save(emp1);
    await employeeRepo.save(emp2);
    await employeeRepo.save(emp3);
  });

  it('should return paginated result', async () => {
    const result = await useCase.execute({ page: 1, limit: 2 });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(2);
    expect(value.meta.totalItems).toBe(3);
    expect(value.meta.page).toBe(1);
    expect(value.meta.limit).toBe(2);
    expect(value.meta.totalPages).toBe(2);
    expect(value.meta.hasNextPage).toBe(true);
    expect(value.meta.hasPrevPage).toBe(false);
  });

  it('should filter by status', async () => {
    const result = await useCase.execute({ page: 1, limit: 10, status: 'ACTIVE' });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(2);
    expect(value.items.every((e) => e.status === 'ACTIVE')).toBe(true);
    expect(value.meta.totalItems).toBe(2);
  });

  it('should filter by search term', async () => {
    const result = await useCase.execute({ page: 1, limit: 10, search: 'john' });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.items.length).toBe(2);
    expect(value.items.every((e) =>
      e.firstName.toLowerCase().includes('john') || e.lastName.toLowerCase().includes('john'),
    )).toBe(true);
  });
});
