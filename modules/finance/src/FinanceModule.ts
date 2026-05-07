import 'reflect-metadata';
import { Router } from 'express';
import { Kysely } from 'kysely';
import { container, injectable } from 'tsyringe';
import { IModule, EventHandlerMap } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';
import { AUTH_TOKENS, createAuthMiddleware, requirePermission, ITokenService } from '@erp/module/auth';
import { ApiResponse } from '@erp/core/http';
import { TOKENS } from './tokens';

// Infrastructure - Repositories
import { KyselyAccountRepository } from './infrastructure/repositories/KyselyAccountRepository';
import { KyselyJournalEntryRepository } from './infrastructure/repositories/KyselyJournalEntryRepository';
import { KyselyInvoiceRepository } from './infrastructure/repositories/KyselyInvoiceRepository';
import { KyselyPaymentRepository } from './infrastructure/repositories/KyselyPaymentRepository';

// Infrastructure - Number Generators
import { SequentialEntryNumberGenerator } from './infrastructure/services/SequentialEntryNumberGenerator';
import { DatabaseInvoiceNumberGenerator } from './infrastructure/services/InvoiceNumberGenerator';

// Application - Use Cases - Account
import { CreateAccountUseCase } from './application/use-cases/account/CreateAccountUseCase';
import { GetAccountUseCase } from './application/use-cases/account/GetAccountUseCase';
import { ListAccountsUseCase } from './application/use-cases/account/ListAccountsUseCase';
import { UpdateAccountUseCase } from './application/use-cases/account/UpdateAccountUseCase';
import { DeleteAccountUseCase } from './application/use-cases/account/DeleteAccountUseCase';

// Application - Use Cases - Journal Entry
import { CreateJournalEntryUseCase } from './application/use-cases/journal-entry/CreateJournalEntryUseCase';
import { GetJournalEntryUseCase } from './application/use-cases/journal-entry/GetJournalEntryUseCase';
import { ListJournalEntriesUseCase } from './application/use-cases/journal-entry/ListJournalEntriesUseCase';
import { UpdateJournalEntryUseCase } from './application/use-cases/journal-entry/UpdateJournalEntryUseCase';
import { PostJournalEntryUseCase } from './application/use-cases/journal-entry/PostJournalEntryUseCase';
import { ReverseJournalEntryUseCase } from './application/use-cases/journal-entry/ReverseJournalEntryUseCase';

// Application - Use Cases - Invoice
import { CreateInvoiceUseCase } from './application/use-cases/invoice/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from './application/use-cases/invoice/GetInvoiceUseCase';
import { ListInvoicesUseCase } from './application/use-cases/invoice/ListInvoicesUseCase';
import { UpdateInvoiceUseCase } from './application/use-cases/invoice/UpdateInvoiceUseCase';
import { ValidateInvoiceUseCase } from './application/use-cases/invoice/ValidateInvoiceUseCase';
import { ChangeInvoiceStatusUseCase } from './application/use-cases/invoice/ChangeInvoiceStatusUseCase';
import { RecordPaymentUseCase } from './application/use-cases/invoice/RecordPaymentUseCase';
import { GetInvoicePaymentsUseCase } from './application/use-cases/invoice/GetInvoicePaymentsUseCase';

// Application - Use Cases - Report
import { GenerateBalanceSheetUseCase } from './application/use-cases/report/GenerateBalanceSheetUseCase';
import { GenerateIncomeStatementUseCase } from './application/use-cases/report/GenerateIncomeStatementUseCase';
import { GenerateCashFlowUseCase } from './application/use-cases/report/GenerateCashFlowUseCase';

// Infrastructure - HTTP
import { AccountController } from './infrastructure/http/AccountController';
import { JournalEntryController } from './infrastructure/http/JournalEntryController';
import { InvoiceController } from './infrastructure/http/InvoiceController';
import { ReportController } from './infrastructure/http/ReportController';
import { createFinanceRoutes } from './infrastructure/http/FinanceRoutes';

export interface FinanceModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}

@injectable()
export class FinanceModule implements IModule {
  name = 'finance';
  version = '1.0.0';
  dependencies: string[] = [];

  private router!: Router;
  private config: FinanceModuleConfig;

  constructor(config: FinanceModuleConfig) {
    this.config = config;
  }

  async register(_container: any): Promise<void> {
    // Register repositories
    container.registerInstance(
      TOKENS.AccountRepository,
      new KyselyAccountRepository(this.config.db),
    );
    container.registerInstance(
      TOKENS.JournalEntryRepository,
      new KyselyJournalEntryRepository(this.config.db),
    );
    container.registerInstance(
      TOKENS.InvoiceRepository,
      new KyselyInvoiceRepository(this.config.db),
    );
    container.registerInstance(
      TOKENS.PaymentRepository,
      new KyselyPaymentRepository(this.config.db),
    );

    // Register number generators
    container.registerInstance(
      TOKENS.EntryNumberGenerator,
      new SequentialEntryNumberGenerator(this.config.db),
    );
    container.registerInstance(
      TOKENS.InvoiceNumberGenerator,
      new DatabaseInvoiceNumberGenerator(this.config.db),
    );

    // Register event bus
    container.registerInstance(TOKENS.EventBus, this.config.eventBus);
  }

  async bootstrap(): Promise<void> {
    const eventBus = container.resolve<any>(TOKENS.EventBus);
    const tokenService = container.resolve<ITokenService>(AUTH_TOKENS.TokenService);
    const authenticate = createAuthMiddleware(tokenService);

    // Resolve repositories
    const accountRepo = container.resolve<any>(TOKENS.AccountRepository);
    const journalEntryRepo = container.resolve<any>(TOKENS.JournalEntryRepository);
    const invoiceRepo = container.resolve<any>(TOKENS.InvoiceRepository);
    const paymentRepo = container.resolve<any>(TOKENS.PaymentRepository);
    const entryNumberGenerator = container.resolve<any>(TOKENS.EntryNumberGenerator);
    const invoiceNumberGenerator = container.resolve<any>(TOKENS.InvoiceNumberGenerator);

    // Instantiate account use cases
    const createAccountUseCase = new CreateAccountUseCase(accountRepo, eventBus);
    const getAccountUseCase = new GetAccountUseCase(accountRepo);
    const listAccountsUseCase = new ListAccountsUseCase(accountRepo);
    const updateAccountUseCase = new UpdateAccountUseCase(accountRepo, eventBus);
    const deleteAccountUseCase = new DeleteAccountUseCase(accountRepo, eventBus);

    // Instantiate journal entry use cases
    const createJournalEntryUseCase = new CreateJournalEntryUseCase(
      journalEntryRepo,
      eventBus,
    );
    const getJournalEntryUseCase = new GetJournalEntryUseCase(journalEntryRepo);
    const listJournalEntriesUseCase = new ListJournalEntriesUseCase(journalEntryRepo);
    const updateJournalEntryUseCase = new UpdateJournalEntryUseCase(journalEntryRepo, eventBus);
    const postJournalEntryUseCase = new PostJournalEntryUseCase(journalEntryRepo, eventBus);
    const reverseJournalEntryUseCase = new ReverseJournalEntryUseCase(
      journalEntryRepo,
      eventBus,
    );

    // Instantiate invoice use cases
    const createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      eventBus,
    );
    const getInvoiceUseCase = new GetInvoiceUseCase(invoiceRepo, paymentRepo);
    const listInvoicesUseCase = new ListInvoicesUseCase(invoiceRepo);
    const updateInvoiceUseCase = new UpdateInvoiceUseCase(invoiceRepo, eventBus);
    const validateInvoiceUseCase = new ValidateInvoiceUseCase(invoiceRepo, eventBus);
    const changeInvoiceStatusUseCase = new ChangeInvoiceStatusUseCase(invoiceRepo, eventBus);
    const recordPaymentUseCase = new RecordPaymentUseCase(paymentRepo, invoiceRepo, eventBus);
    const getInvoicePaymentsUseCase = new GetInvoicePaymentsUseCase(paymentRepo);

    // Instantiate report use cases
    const generateBalanceSheetUseCase = new GenerateBalanceSheetUseCase(accountRepo, journalEntryRepo);
    const generateIncomeStatementUseCase = new GenerateIncomeStatementUseCase(
      accountRepo,
      journalEntryRepo,
    );
    const generateCashFlowUseCase = new GenerateCashFlowUseCase(accountRepo, journalEntryRepo);

    // Instantiate controllers
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
    this.router = createFinanceRoutes(
      accountController,
      journalEntryController,
      invoiceController,
      reportController,
      authenticate,
      requirePermission,
    );

    // Health check endpoint
    this.router.get('/health', (_req, res) => {
      res.json(
        ApiResponse.success(
          {
            module: 'finance',
            status: 'ok',
            version: this.version,
          },
          'Finance module health check',
        ),
      );
    });
  }

  getRoutes(): Router {
    return this.router;
  }

  getEventHandlers(): EventHandlerMap {
    return {};
  }

  async teardown(): Promise<void> {
    // Clean up if needed
  }
}
