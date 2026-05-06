import { CreateEmployeeUseCase } from '../CreateEmployeeUseCase';
import { MockEmployeeRepository } from '../../../../tests/mocks/MockEmployeeRepository';
import { MockEmployeeNumberGenerator } from '../../../../tests/mocks/MockEmployeeNumberGenerator';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';

const mockUserAccountCreator = {
  createAccount: jest.fn().mockResolvedValue({ userId: 'user-123', temporaryPassword: 'TempPass1!xyz' }),
};

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let employeeRepo: MockEmployeeRepository;
  let numberGenerator: MockEmployeeNumberGenerator;
  let eventBus: MockEventBus;

  beforeEach(() => {
    jest.clearAllMocks();
    employeeRepo = new MockEmployeeRepository();
    numberGenerator = new MockEmployeeNumberGenerator();
    eventBus = new MockEventBus();
    mockUserAccountCreator.createAccount.mockResolvedValue({ userId: 'user-123', temporaryPassword: 'TempPass1!xyz' });
    useCase = new CreateEmployeeUseCase(employeeRepo, numberGenerator, mockUserAccountCreator as any, eventBus);
  });

  it('should create employee with auto-generated user account', async () => {
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
    expect(value.status).toBe('ACTIVE');
    expect(value.employeeNumber).toBe('EMP-00001');
    expect(value.userId).toBe('user-123');
    expect(value.temporaryPassword).toBe('TempPass1!xyz');

    expect(mockUserAccountCreator.createAccount).toHaveBeenCalledWith('john@example.com', 'EMPLOYEE');
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
