import { CreateAccountUseCase } from '../CreateAccountUseCase';
import { MockAccountRepository } from '../../../../tests/mocks/MockAccountRepository';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let accountRepo: MockAccountRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    jest.clearAllMocks();
    accountRepo = new MockAccountRepository();
    eventBus = new MockEventBus();
    useCase = new CreateAccountUseCase(accountRepo, eventBus);
  });

  it('should create account with valid props', async () => {
    const dto = {
      code: '1-1001',
      name: 'Cash',
      description: 'Primary cash account',
      type: 'ASSET',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const account = result.getValue();
    expect(account.code).toBe('1-1001');
    expect(account.name).toBe('Cash');
    expect(account.type).toBe('ASSET');
    expect(account.isActive).toBe(true);
    expect(account.id).toBeDefined();

    const savedAccount = await accountRepo.findById(account.id);
    expect(savedAccount).toBeDefined();

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('finance.account.created');
  });

  it('should create account with parent', async () => {
    const parentDto = {
      code: '1-1000',
      name: 'Current Assets',
      type: 'ASSET',
    };

    const parentResult = await useCase.execute(parentDto);
    const parentId = parentResult.getValue().id;

    const childDto = {
      code: '1-1001',
      name: 'Cash',
      type: 'ASSET',
      parentId,
    };

    const childResult = await useCase.execute(childDto);

    expect(childResult.isSuccess()).toBe(true);
    expect(childResult.getValue().parentId).toBe(parentId);
  });

  it('should fail if code already exists', async () => {
    const dto = {
      code: '1-1001',
      name: 'Cash',
      type: 'ASSET',
    };

    await useCase.execute(dto);

    const result = await useCase.execute({
      ...dto,
      name: 'Another Cash',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ACCOUNT_CODE_EXISTS');
  });

  it('should fail with invalid code', async () => {
    const dto = {
      code: 'INVALID',
      name: 'Cash',
      type: 'ASSET',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('INVALID_ACCOUNT_CODE');
  });

  it('should fail with invalid type', async () => {
    const dto = {
      code: '1-1001',
      name: 'Cash',
      type: 'INVALID',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('INVALID_ACCOUNT_TYPE');
  });

  it('should fail with empty name', async () => {
    const dto = {
      code: '1-1001',
      name: '',
      type: 'ASSET',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ACCOUNT_NAME_REQUIRED');
  });

  it('should fail if parent not found', async () => {
    const dto = {
      code: '1-1001',
      name: 'Cash',
      type: 'ASSET',
      parentId: 'non-existent-id',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ACCOUNT_PARENT_NOT_FOUND');
  });
});
