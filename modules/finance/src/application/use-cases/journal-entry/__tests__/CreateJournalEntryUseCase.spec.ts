import { CreateJournalEntryUseCase } from '../CreateJournalEntryUseCase';
import { MockJournalEntryRepository } from '../../../../tests/mocks/MockJournalEntryRepository';
import { MockAccountRepository } from '../../../../tests/mocks/MockAccountRepository';
import { MockEntryNumberGenerator } from '../../../../tests/mocks/MockEntryNumberGenerator';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';
import { Account } from '../../../../domain/entities/Account';

describe('CreateJournalEntryUseCase', () => {
  let useCase: CreateJournalEntryUseCase;
  let journalEntryRepo: MockJournalEntryRepository;
  let accountRepo: MockAccountRepository;
  let numberGenerator: MockEntryNumberGenerator;
  let eventBus: MockEventBus;
  let account1: Account;
  let account2: Account;

  beforeEach(async () => {
    jest.clearAllMocks();
    journalEntryRepo = new MockJournalEntryRepository();
    accountRepo = new MockAccountRepository();
    numberGenerator = new MockEntryNumberGenerator();
    eventBus = new MockEventBus();

    // Create test accounts
    const acc1 = Account.create({ code: '1-1001', name: 'Cash', type: 'ASSET' });
    const acc2 = Account.create({ code: '2-2001', name: 'Accounts Payable', type: 'LIABILITY' });
    account1 = acc1.getValue();
    account2 = acc2.getValue();
    await accountRepo.save(account1);
    await accountRepo.save(account2);

    useCase = new CreateJournalEntryUseCase(
      journalEntryRepo,
      accountRepo,
      numberGenerator,
      eventBus,
    );
  });

  it('should create journal entry with valid props', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: 'Test entry',
      lineItems: [
        { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
        { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 100 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const entry = result.getValue();
    expect(entry.entryNumber).toBe('JE-000001');
    expect(entry.description).toBe('Test entry');
    expect(entry.status).toBe('DRAFT');
    expect(entry.lineItems).toHaveLength(2);

    const savedEntry = await journalEntryRepo.findById(entry.id);
    expect(savedEntry).toBeDefined();
  });

  it('should fail if accounts not found', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: 'Test entry',
      lineItems: [
        { accountId: 'non-existent', description: 'Debit', debitAmount: 100, creditAmount: 0 },
        { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 100 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('JOURNAL_ENTRY_INVALID_ACCOUNT');
  });

  it('should fail with unbalanced entry', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: 'Test entry',
      lineItems: [
        { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
        { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 90 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('JOURNAL_ENTRY_UNBALANCED');
  });

  it('should fail with less than 2 line items', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: 'Test entry',
      lineItems: [
        { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('JOURNAL_ENTRY_NO_LINE_ITEMS');
  });

  it('should fail with empty description', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: '',
      lineItems: [
        { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
        { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 100 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
  });

  it('should generate unique entry numbers', async () => {
    const dto = {
      date: new Date('2024-01-15'),
      description: 'Test entry',
      lineItems: [
        { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
        { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 100 },
      ],
    };

    const result1 = await useCase.execute(dto);
    const result2 = await useCase.execute(dto);

    expect(result1.getValue().entryNumber).toBe('JE-000001');
    expect(result2.getValue().entryNumber).toBe('JE-000002');
  });
});
