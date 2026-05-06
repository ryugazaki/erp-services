import { UpdateEmployeeUseCase } from '../UpdateEmployeeUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Employee } from '../../../../domain/entities/Employee';

describe('UpdateEmployeeUseCase', () => {
  let useCase: UpdateEmployeeUseCase;
  let employeeRepo: MockEmployeeRepository;
  let eventBus: MockEventBus;

  beforeEach(async () => {
    employeeRepo = new MockEmployeeRepository();
    eventBus = new MockEventBus();
    useCase = new UpdateEmployeeUseCase(employeeRepo, eventBus);

    const emp = Employee.reconstitute({
      id: 'emp-1',
      employeeNumber: 'EMP-00001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '111',
      departmentId: null,
      position: null,
      hireDate: new Date('2026-01-01'),
      status: 'ACTIVE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await employeeRepo.save(emp);
  });

  it('should update existing employee', async () => {
    const result = await useCase.execute({
      id: 'emp-1',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '999',
      position: 'Developer',
    });

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.firstName).toBe('Jane');
    expect(value.lastName).toBe('Smith');
    expect(value.phone).toBe('999');
    expect(value.position).toBe('Developer');
    expect(value.email).toBe('john@test.com');
    expect(value.id).toBe('emp-1');
  });

  it('should fail if employee not found', async () => {
    const result = await useCase.execute({
      id: 'nonexistent-id',
      firstName: 'Jane',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_FOUND');
  });

  it('should persist updated employee in repository', async () => {
    await useCase.execute({
      id: 'emp-1',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    const updated = await employeeRepo.findById('emp-1');
    expect(updated!.firstName).toBe('Jane');
    expect(updated!.lastName).toBe('Smith');
  });
});
