import { CreateDepartmentUseCase } from '../CreateDepartmentUseCase';
import { MockDepartmentRepository } from '../../../../tests/mocks/MockDepartmentRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';

describe('CreateDepartmentUseCase', () => {
  let useCase: CreateDepartmentUseCase;
  let departmentRepo: MockDepartmentRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    departmentRepo = new MockDepartmentRepository();
    eventBus = new MockEventBus();
    useCase = new CreateDepartmentUseCase(departmentRepo, eventBus);
  });

  it('should create department with valid data', async () => {
    const dto = {
      name: 'Engineering',
      code: 'ENG',
      description: 'Engineering department',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const value = result.getValue();
    expect(value.name).toBe('Engineering');
    expect(value.code).toBe('ENG');
    expect(value.description).toBe('Engineering department');
    expect(value.isActive).toBe(true);
    expect(value.id).toBeDefined();
  });

  it('should fail if department code already exists', async () => {
    await useCase.execute({ name: 'Engineering', code: 'ENG' });

    const result = await useCase.execute({ name: 'Another', code: 'ENG' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_CODE_EXISTS');
  });

  it('should fail with empty name', async () => {
    const result = await useCase.execute({ name: '', code: 'ENG' });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('DEPARTMENT_NAME_REQUIRED');
  });

  it('should publish events after creation', async () => {
    await useCase.execute({ name: 'Engineering', code: 'ENG' });

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('hr.department.created');
  });
});
