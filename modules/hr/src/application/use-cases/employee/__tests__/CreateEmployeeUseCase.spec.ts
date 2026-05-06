import { CreateEmployeeUseCase } from '../CreateEmployeeUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEmployeeNumberGenerator } from '../../../../tests/mocks/MockEmployeeNumberGenerator';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let employeeRepo: MockEmployeeRepository;
  let numberGenerator: MockEmployeeNumberGenerator;
  let eventBus: MockEventBus;

  beforeEach(() => {
    employeeRepo = new MockEmployeeRepository();
    numberGenerator = new MockEmployeeNumberGenerator();
    eventBus = new MockEventBus();
    useCase = new CreateEmployeeUseCase(employeeRepo, numberGenerator, eventBus);
  });

  it('should create employee successfully with valid data and status ACTIVE', async () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      hireDate: new Date('2026-01-01'),
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.firstName).toBe('John');
    expect(value.lastName).toBe('Doe');
    expect(value.email).toBe('john@example.com');
    expect(value.status).toBe('ACTIVE');
    expect(value.employeeNumber).toBe('EMP-00001');
    expect(value.id).toBeDefined();
  });

  it('should fail if email already exists', async () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '',
      hireDate: new Date('2026-01-01'),
    };

    await useCase.execute(dto);

    const result = await useCase.execute({
      ...dto,
      firstName: 'Jane',
      lastName: 'Smith',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_EMAIL_EXISTS');
  });

  it('should publish events after creation', async () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '',
      hireDate: new Date('2026-01-01'),
    };

    await useCase.execute(dto);

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
  });

  it('should use generated employee number', async () => {
    numberGenerator.setPrefix('TEST');
    numberGenerator.setNext(42);

    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '',
      hireDate: new Date('2026-01-01'),
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().employeeNumber).toBe('TEST-00042');
  });
});
