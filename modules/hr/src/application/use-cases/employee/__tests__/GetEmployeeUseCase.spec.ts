import { GetEmployeeUseCase } from '../GetEmployeeUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { Employee } from '../../../../domain/entities/Employee';

describe('GetEmployeeUseCase', () => {
  let useCase: GetEmployeeUseCase;
  let employeeRepo: MockEmployeeRepository;

  beforeEach(() => {
    employeeRepo = new MockEmployeeRepository();
    useCase = new GetEmployeeUseCase(employeeRepo);
  });

  it('should get an existing employee', async () => {
    const emp = Employee.reconstitute({
      id: 'emp-1',
      employeeNumber: 'EMP-00001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '',
      departmentId: null,
      position: null,
      hireDate: new Date('2026-01-01'),
      status: 'ACTIVE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await employeeRepo.save(emp);

    const result = await useCase.execute({ id: 'emp-1' });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.id).toBe('emp-1');
    expect(value.firstName).toBe('John');
    expect(value.lastName).toBe('Doe');
    expect(value.email).toBe('john@test.com');
    expect(value.status).toBe('ACTIVE');
  });

  it('should fail if employee not found', async () => {
    const result = await useCase.execute({ id: 'nonexistent-id' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_FOUND');
  });
});
