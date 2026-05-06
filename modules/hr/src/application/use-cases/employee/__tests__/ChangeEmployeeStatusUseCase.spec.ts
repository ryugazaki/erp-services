import { ChangeEmployeeStatusUseCase } from '../ChangeEmployeeStatusUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Employee } from '../../../../domain/entities/Employee';

describe('ChangeEmployeeStatusUseCase', () => {
  let useCase: ChangeEmployeeStatusUseCase;
  let employeeRepo: MockEmployeeRepository;
  let eventBus: MockEventBus;
  let employee: Employee;

  beforeEach(() => {
    employeeRepo = new MockEmployeeRepository();
    eventBus = new MockEventBus();
    useCase = new ChangeEmployeeStatusUseCase(employeeRepo, eventBus);

    employee = Employee.create({
      employeeNumber: 'EMP-00001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      hireDate: new Date('2024-01-01'),
    }).getValue();

    employee.pullEvents(); // clear creation event
    employeeRepo.save(employee);
  });

  it('should change employee status to INACTIVE', async () => {
    const result = await useCase.execute({ id: employee.id, status: 'INACTIVE' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().status).toBe('INACTIVE');
  });

  it('should change employee status to SUSPENDED', async () => {
    const result = await useCase.execute({ id: employee.id, status: 'SUSPENDED' });

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().status).toBe('SUSPENDED');
  });

  it('should fail if employee not found', async () => {
    const result = await useCase.execute({ id: 'non-existent', status: 'INACTIVE' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_NOT_FOUND');
  });

  it('should publish events after status change', async () => {
    await useCase.execute({ id: employee.id, status: 'INACTIVE' });

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('hr.employee.status-changed');
  });

  it('should preserve other employee fields', async () => {
    const result = await useCase.execute({ id: employee.id, status: 'INACTIVE' });

    expect(result.getValue().firstName).toBe('John');
    expect(result.getValue().email).toBe('john@example.com');
    expect(result.getValue().employeeNumber).toBe('EMP-00001');
  });
});
