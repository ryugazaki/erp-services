import request from 'supertest';
import { createFinanceRoutes } from '../../src/infrastructure/http/FinanceRoutes';
import { Router } from 'express';
import { AccountController } from '../../src/infrastructure/http/AccountController';
import { JournalEntryController } from '../../src/infrastructure/http/JournalEntryController';
import { InvoiceController } from '../../src/infrastructure/http/InvoiceController';
import { ReportController } from '../../src/infrastructure/http/ReportController';
import { CreateAccountUseCase } from '../../src/application/use-cases/account/CreateAccountUseCase';
import { MockAccountRepository } from '../../src/tests/mocks/MockAccountRepository';
import { MockJournalEntryRepository } from '../../src/tests/mocks/MockJournalEntryRepository';
import { MockInvoiceRepository } from '../../src/tests/mocks/MockInvoiceRepository';
import { MockPaymentRepository } from '../../src/tests/mocks/MockPaymentRepository';
import { MockEntryNumberGenerator } from '../../src/tests/mocks/MockEntryNumberGenerator';
import { MockInvoiceNumberGenerator } from '../../src/tests/mocks/MockInvoiceNumberGenerator';
import { MockEventBus } from '../../src/tests/mocks/MockEventBus';
import { GetAccountUseCase } from '../../src/application/use-cases/account/GetAccountUseCase';
import { ListAccountsUseCase } from '../../src/application/use-cases/account/ListAccountsUseCase';
import { UpdateAccountUseCase } from '../../src/application/use-cases/account/UpdateAccountUseCase';
import { DeleteAccountUseCase } from '../../src/application/use-cases/account/DeleteAccountUseCase';
import { CreateJournalEntryUseCase } from '../../src/application/use-cases/journal-entry/CreateJournalEntryUseCase';
import { GetJournalEntryUseCase } from '../../src/application/use-cases/journal-entry/GetJournalEntryUseCase';
import { ListJournalEntriesUseCase } from '../../src/application/use-cases/journal-entry/ListJournalEntriesUseCase';
import { UpdateJournalEntryUseCase } from '../../src/application/use-cases/journal-entry/UpdateJournalEntryUseCase';
import { PostJournalEntryUseCase } from '../../src/application/use-cases/journal-entry/PostJournalEntryUseCase';
import { ReverseJournalEntryUseCase } from '../../src/application/use-cases/journal-entry/ReverseJournalEntryUseCase';
import { CreateInvoiceUseCase } from '../../src/application/use-cases/invoice/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from '../../src/application/use-cases/invoice/GetInvoiceUseCase';
import { ListInvoicesUseCase } from '../../src/application/use-cases/invoice/ListInvoicesUseCase';
import { UpdateInvoiceUseCase } from '../../src/application/use-cases/invoice/UpdateInvoiceUseCase';
import { ValidateInvoiceUseCase } from '../../src/application/use-cases/invoice/ValidateInvoiceUseCase';
import { ChangeInvoiceStatusUseCase } from '../../src/application/use-cases/invoice/ChangeInvoiceStatusUseCase';
import { RecordPaymentUseCase } from '../../src/application/use-cases/invoice/RecordPaymentUseCase';
import { GetInvoicePaymentsUseCase } from '../../src/application/use-cases/invoice/GetInvoicePaymentsUseCase';
import { GenerateBalanceSheetUseCase } from '../../src/application/use-cases/report/GenerateBalanceSheetUseCase';
import { GenerateIncomeStatementUseCase } from '../../src/application/use-cases/report/GenerateIncomeStatementUseCase';
import { GenerateCashFlowUseCase } from '../../src/application/use-cases/report/GenerateCashFlowUseCase';

// Mock auth middleware
const mockAuthenticate = (req: any, _res: any, next: any) => {
  req.user = { sub: 'user-123', permissions: ['finance:accounts:read', 'finance:accounts:write', 'finance:journal-entries:read', 'finance:journal-entries:write', 'finance:invoices:read', 'finance:invoices:write', 'finance:reports:read'] };
  next();
};

const mockRequirePermission = (...permissions: string[]) => (req: any, _res: any, next: any) => {
  next();
};

describe('Finance API E2E', () => {
  let app: Router;
  let accountRepo: MockAccountRepository;
  let journalEntryRepo: MockJournalEntryRepository;
  let invoiceRepo: MockInvoiceRepository;
  let paymentRepo: MockPaymentRepository;
  let eventBus: MockEventBus;
  let entryNumberGenerator: MockEntryNumberGenerator;
  let invoiceNumberGenerator: MockInvoiceNumberGenerator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup repositories
    accountRepo = new MockAccountRepository();
    journalEntryRepo = new MockJournalEntryRepository();
    invoiceRepo = new MockInvoiceRepository();
    paymentRepo = new MockPaymentRepository();
    eventBus = new MockEventBus();
    entryNumberGenerator = new MockEntryNumberGenerator();
    invoiceNumberGenerator = new MockInvoiceNumberGenerator();

    // Account use cases
    const createAccountUseCase = new CreateAccountUseCase(accountRepo, eventBus);
    const getAccountUseCase = new GetAccountUseCase(accountRepo);
    const listAccountsUseCase = new ListAccountsUseCase(accountRepo);
    const updateAccountUseCase = new UpdateAccountUseCase(accountRepo, eventBus);
    const deleteAccountUseCase = new DeleteAccountUseCase(accountRepo);

    // Journal entry use cases
    const createJournalEntryUseCase = new CreateJournalEntryUseCase(
      journalEntryRepo,
      accountRepo,
      entryNumberGenerator,
      eventBus,
    );
    const getJournalEntryUseCase = new GetJournalEntryUseCase(journalEntryRepo);
    const listJournalEntriesUseCase = new ListJournalEntriesUseCase(journalEntryRepo);
    const updateJournalEntryUseCase = new UpdateJournalEntryUseCase(journalEntryRepo);
    const postJournalEntryUseCase = new PostJournalEntryUseCase(journalEntryRepo, eventBus);
    const reverseJournalEntryUseCase = new ReverseJournalEntryUseCase(
      journalEntryRepo,
      createJournalEntryUseCase,
      eventBus,
    );

    // Invoice use cases
    const createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      invoiceNumberGenerator,
      eventBus,
    );
    const getInvoiceUseCase = new GetInvoiceUseCase(invoiceRepo);
    const listInvoicesUseCase = new ListInvoicesUseCase(invoiceRepo);
    const updateInvoiceUseCase = new UpdateInvoiceUseCase(invoiceRepo);
    const validateInvoiceUseCase = new ValidateInvoiceUseCase(invoiceRepo, eventBus);
    const changeInvoiceStatusUseCase = new ChangeInvoiceStatusUseCase(invoiceRepo, eventBus);
    const recordPaymentUseCase = new RecordPaymentUseCase(paymentRepo, invoiceRepo, eventBus);
    const getInvoicePaymentsUseCase = new GetInvoicePaymentsUseCase(paymentRepo);

    // Report use cases
    const generateBalanceSheetUseCase = new GenerateBalanceSheetUseCase(accountRepo, journalEntryRepo);
    const generateIncomeStatementUseCase = new GenerateIncomeStatementUseCase(accountRepo, journalEntryRepo);
    const generateCashFlowUseCase = new GenerateCashFlowUseCase(accountRepo, journalEntryRepo);

    // Controllers
    const accountController = new AccountController(
      createAccountUseCase,
      getAccountUseCase,
      listAccountsUseCase,
      updateAccountUseCase,
      deleteAccountUseCase,
    );

    const journalEntryController = new JournalEntryController(
      createJournalEntryUseCase,
      getJournalEntryUseCase,
      listJournalEntriesUseCase,
      updateJournalEntryUseCase,
      postJournalEntryUseCase,
      reverseJournalEntryUseCase,
    );

    const invoiceController = new InvoiceController(
      createInvoiceUseCase,
      getInvoiceUseCase,
      listInvoicesUseCase,
      updateInvoiceUseCase,
      validateInvoiceUseCase,
      changeInvoiceStatusUseCase,
      recordPaymentUseCase,
      getInvoicePaymentsUseCase,
    );

    const reportController = new ReportController(
      generateBalanceSheetUseCase,
      generateIncomeStatementUseCase,
      generateCashFlowUseCase,
    );

    // Create routes
    app = createFinanceRoutes(
      accountController,
      journalEntryController,
      invoiceController,
      reportController,
      mockAuthenticate,
      mockRequirePermission,
    );
  });

  describe('Account Endpoints', () => {
    describe('POST /accounts', () => {
      it('should create account successfully', async () => {
        const response = await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Cash',
            description: 'Primary cash account',
            type: 'ASSET',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.code).toBe('1-1001');
        expect(response.body.data.name).toBe('Cash');
        expect(response.body.data.type).toBe('ASSET');
        expect(response.body.data.isActive).toBe(true);
      });

      it('should return 400 for invalid account code', async () => {
        const response = await request(app)
          .post('/accounts')
          .send({
            code: 'INVALID',
            name: 'Test',
            type: 'ASSET',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toContain('INVALID_ACCOUNT_CODE');
      });

      it('should return 409 for duplicate code', async () => {
        await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Cash',
            type: 'ASSET',
          })
          .expect(201);

        const response = await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Another Cash',
            type: 'ASSET',
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('ACCOUNT_CODE_EXISTS');
      });
    });

    describe('GET /accounts', () => {
      it('should list accounts with pagination', async () => {
        await request(app)
          .post('/accounts')
          .send({ code: '1-1001', name: 'Cash', type: 'ASSET' })
          .expect(201);

        await request(app)
          .post('/accounts')
          .send({ code: '1-1002', name: 'Bank', type: 'ASSET' })
          .expect(201);

        const response = await request(app)
          .get('/accounts?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta.pagination.page).toBe(1);
        expect(response.body.meta.pagination.totalItems).toBe(2);
      });

      it('should filter by type', async () => {
        await request(app)
          .post('/accounts')
          .send({ code: '1-1001', name: 'Cash', type: 'ASSET' })
          .expect(201);

        await request(app)
          .post('/accounts')
          .send({ code: '2-2001', name: 'AP', type: 'LIABILITY' })
          .expect(201);

        const response = await request(app)
          .get('/accounts?type=ASSET')
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].type).toBe('ASSET');
      });
    });

    describe('GET /accounts/:id', () => {
      it('should get account by ID', async () => {
        const createResponse = await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Cash',
            type: 'ASSET',
          })
          .expect(201);

        const accountId = createResponse.body.data.id;

        const response = await request(app)
          .get(`/accounts/${accountId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(accountId);
        expect(response.body.data.name).toBe('Cash');
      });

      it('should return 404 for non-existent account', async () => {
        const response = await request(app)
          .get('/accounts/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('ACCOUNT_NOT_FOUND');
      });
    });

    describe('PATCH /accounts/:id', () => {
      it('should update account', async () => {
        const createResponse = await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Cash',
            type: 'ASSET',
          })
          .expect(201);

        const accountId = createResponse.body.data.id;

        const response = await request(app)
          .patch(`/accounts/${accountId}`)
          .send({
            name: 'Petty Cash',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Petty Cash');
        expect(response.body.data.description).toBe('Updated description');
      });
    });

    describe('DELETE /accounts/:id', () => {
      it('should delete account', async () => {
        const createResponse = await request(app)
          .post('/accounts')
          .send({
            code: '1-1001',
            name: 'Cash',
            type: 'ASSET',
          })
          .expect(201);

        const accountId = createResponse.body.data.id;

        await request(app)
          .delete(`/accounts/${accountId}`)
          .expect(200);

        const response = await request(app)
          .get(`/accounts/${accountId}`)
          .expect(404);

        expect(response.body.error.code).toBe('ACCOUNT_NOT_FOUND');
      });
    });
  });

  describe('Journal Entry Endpoints', () => {
    let account1: any;
    let account2: any;

    beforeEach(async () => {
      const acc1 = await request(app)
        .post('/accounts')
        .send({ code: '1-1001', name: 'Cash', type: 'ASSET' })
        .expect(201);

      const acc2 = await request(app)
        .post('/accounts')
        .send({ code: '2-2001', name: 'AP', type: 'LIABILITY' })
        .expect(201);

      account1 = acc1.body.data;
      account2 = acc2.body.data;
    });

    describe('POST /journal-entries', () => {
      it('should create journal entry successfully', async () => {
        const response = await request(app)
          .post('/journal-entries')
          .send({
            date: '2024-01-15',
            description: 'Test entry',
            lineItems: [
              { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
              { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 100 },
            ],
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.entryNumber).toBe('JE-000001');
        expect(response.body.data.description).toBe('Test entry');
        expect(response.body.data.status).toBe('DRAFT');
      });

      it('should return 400 for unbalanced entry', async () => {
        const response = await request(app)
          .post('/journal-entries')
          .send({
            date: '2024-01-15',
            description: 'Test entry',
            lineItems: [
              { accountId: account1.id, description: 'Debit', debitAmount: 100, creditAmount: 0 },
              { accountId: account2.id, description: 'Credit', debitAmount: 0, creditAmount: 90 },
            ],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('JOURNAL_ENTRY_UNBALANCED');
      });
    });

    describe('GET /journal-entries', () => {
      it('should list journal entries', async () => {
        await request(app)
          .post('/journal-entries')
          .send({
            date: '2024-01-15',
            description: 'Entry 1',
            lineItems: [
              { accountId: account1.id, description: 'D', debitAmount: 100, creditAmount: 0 },
              { accountId: account2.id, description: 'C', debitAmount: 0, creditAmount: 100 },
            ],
          })
          .expect(201);

        const response = await request(app)
          .get('/journal-entries')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe('POST /journal-entries/:id/post', () => {
      it('should post journal entry', async () => {
        const createResponse = await request(app)
          .post('/journal-entries')
          .send({
            date: '2024-01-15',
            description: 'Test',
            lineItems: [
              { accountId: account1.id, description: 'D', debitAmount: 100, creditAmount: 0 },
              { accountId: account2.id, description: 'C', debitAmount: 0, creditAmount: 100 },
            ],
          })
          .expect(201);

        const entryId = createResponse.body.data.id;

        const response = await request(app)
          .post(`/journal-entries/${entryId}/post`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('POSTED');
      });
    });
  });

  describe('Invoice Endpoints', () => {
    describe('POST /invoices', () => {
      it('should create receivable invoice successfully', async () => {
        const response = await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [
              { description: 'Product A', quantity: 2, unitPrice: 100, taxRate: 10 },
              { description: 'Product B', quantity: 1, unitPrice: 50, taxRate: 10 },
            ],
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.invoiceNumber).toBe('INV-20240115-0001');
        expect(response.body.data.type).toBe('RECEIVABLE');
        expect(response.body.data.totalAmount).toBe(275);
        expect(response.body.data.status).toBe('DRAFT');
      });

      it('should create payable invoice successfully', async () => {
        const response = await request(app)
          .post('/invoices')
          .send({
            type: 'PAYABLE',
            customerId: 'vendor-123',
            customerName: 'Supplier Inc',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [
              { description: 'Service', quantity: 1, unitPrice: 500, taxRate: 20 },
            ],
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.invoiceNumber).toBe('BL-20240115-0001');
        expect(response.body.data.type).toBe('PAYABLE');
      });

      it('should return 400 for no line items', async () => {
        const response = await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVOICE_NO_LINE_ITEMS');
      });
    });

    describe('GET /invoices', () => {
      it('should list invoices with pagination', async () => {
        await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [{ description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 }],
          })
          .expect(201);

        const response = await request(app)
          .get('/invoices')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
      });

      it('should filter by type', async () => {
        await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [{ description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 }],
          })
          .expect(201);

        await request(app)
          .post('/invoices')
          .send({
            type: 'PAYABLE',
            customerId: 'vendor-123',
            customerName: 'Supplier Inc',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 10 }],
          })
          .expect(201);

        const response = await request(app)
          .get('/invoices?type=RECEIVABLE')
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].type).toBe('RECEIVABLE');
      });
    });

    describe('POST /invoices/:id/validate', () => {
      it('should validate invoice and change status to PENDING', async () => {
        const createResponse = await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [{ description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 }],
          })
          .expect(201);

        const invoiceId = createResponse.body.data.id;

        const response = await request(app)
          .post(`/invoices/${invoiceId}/validate`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PENDING');
      });
    });

    describe('POST /invoices/:id/payments', () => {
      it('should record payment for invoice', async () => {
        const createResponse = await request(app)
          .post('/invoices')
          .send({
            type: 'RECEIVABLE',
            customerId: 'customer-123',
            customerName: 'Acme Corp',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            lineItems: [{ description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 }],
          })
          .expect(201);

        const invoiceId = createResponse.body.data.id;

        const response = await request(app)
          .post(`/invoices/${invoiceId}/payments`)
          .send({
            amount: 110,
            paymentDate: '2024-01-20',
            paymentMethod: 'BANK_TRANSFER',
            reference: 'REF-001',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.amount).toBe(110);
      });
    });
  });

  describe('Report Endpoints', () => {
    let account1: any;
    let account2: any;

    beforeEach(async () => {
      const acc1 = await request(app)
        .post('/accounts')
        .send({ code: '1-1001', name: 'Cash', type: 'ASSET' })
        .expect(201);

      const acc2 = await request(app)
        .post('/accounts')
        .send({ code: '4-4001', name: 'Sales Revenue', type: 'REVENUE' })
        .expect(201);

      account1 = acc1.body.data;
      account2 = acc2.body.data;
    });

    describe('GET /reports/balance-sheet', () => {
      it('should generate balance sheet', async () => {
        const response = await request(app)
          .get('/reports/balance-sheet?asOfDate=2024-01-15')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.asOfDate).toBeDefined();
        expect(response.body.data.assets).toBeDefined();
        expect(response.body.data.liabilities).toBeDefined();
        expect(response.body.data.equity).toBeDefined();
      });
    });

    describe('GET /reports/income-statement', () => {
      it('should generate income statement', async () => {
        const response = await request(app)
          .get('/reports/income-statement?startDate=2024-01-01&endDate=2024-01-31')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.startDate).toBeDefined();
        expect(response.body.data.endDate).toBeDefined();
        expect(response.body.data.revenue).toBeDefined();
        expect(response.body.data.expenses).toBeDefined();
        expect(response.body.data.netIncome).toBeDefined();
      });
    });

    describe('GET /reports/cash-flow', () => {
      it('should generate cash flow statement', async () => {
        const response = await request(app)
          .get('/reports/cash-flow?startDate=2024-01-01&endDate=2024-01-31')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.operatingActivities).toBeDefined();
        expect(response.body.data.investingActivities).toBeDefined();
        expect(response.body.data.financingActivities).toBeDefined();
      });
    });
  });
});
