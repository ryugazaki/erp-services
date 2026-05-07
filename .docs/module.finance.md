# Finance Module — Implementation Reference

## Implementation Status

> **Last Updated:** 2026-05-06
> **Version:** 1.0.0-alpha
> **Status:** 🚧 Under Construction

### ✅ Completed

| Layer | Component | Files |
|-------|-----------|-------|
| **Domain** | Value Objects (6) | `AccountCode.ts`, `AccountType.ts`, `InvoiceType.ts`, `InvoiceStatus.ts`, `JournalEntryStatus.ts`, `Money.ts` |
| **Domain** | Entities (4) | `Account.ts`, `JournalEntry.ts`, `Invoice.ts`, `Payment.ts` |
| **Domain** | Events (10) | `AccountCreated.ts`, `AccountUpdated.ts`, `AccountDeactivated.ts`, `JournalEntryPosted.ts`, `JournalEntryReversed.ts`, `InvoiceCreated.ts`, `InvoiceValidated.ts`, `InvoicePaid.ts`, `InvoiceCancelled.ts`, `PaymentRecorded.ts` |
| **Domain** | Repository Interfaces (4) | `IAccountRepository.ts`, `IJournalEntryRepository.ts`, `IInvoiceRepository.ts`, `IPaymentRepository.ts` |
| **Application** | DTOs (13) | All Zod schemas for accounts, journal entries, invoices, payments, reports |
| **Application** | Use Cases (23) | All use cases implemented |
| **Infrastructure** | Database Migrations (2) | `001_create_finance_schema.sql`, `002_create_invoices.sql` |
| **Infrastructure** | Kysely Repositories (4) | `KyselyAccountRepository.ts`, `KyselyJournalEntryRepository.ts`, `KyselyInvoiceRepository.ts`, `KyselyPaymentRepository.ts` |
| **Infrastructure** | Number Generators (2) | `SequentialEntryNumberGenerator.ts`, `DatabaseInvoiceNumberGenerator.ts` |
| **Module** | Bootstrap | `FinanceModule.ts` (with placeholder routes) |

### ✅ Completed - HTTP Layer

| Layer | Component | Files |
|---|---|---|
| **Infrastructure** | Controllers (4) | `AccountController.ts`, `JournalEntryController.ts`, `InvoiceController.ts`, `ReportController.ts` |
| **Infrastructure** | HTTP Routes | `FinanceRoutes.ts` (with Swagger annotations) |
| **Infrastructure** | Error Mapper | `FinanceErrorMapper.ts` |

---

## Table of Contents

- [Implementation Status](#implementation-status)
1. [Module Overview](#1-module-overview)
2. [API Endpoints](#2-api-endpoints)
3. [Domain Layer](#3-domain-layer)
   - 3.1 [Entities](#31-entities)
   - 3.2 [Value Objects](#32-value-objects)
   - 3.3 [Domain Events](#33-domain-events)
   - 3.4 [Repository Interfaces](#34-repository-interfaces)
4. [Application Layer](#4-application-layer)
   - 4.1 [DTOs & Validation Schemas](#41-dtos--validation-schemas)
   - 4.2 [Use Cases](#42-use-cases)
   - 4.3 [Tokens (DI)](#43-tokens-di)
5. [Infrastructure Layer](#5-infrastructure-layer)
   - 5.1 [Database Schema](#51-database-schema)
   - 5.2 [HTTP Layer](#52-http-layer)
6. [Error Handling](#6-error-handling)
7. [Module Bootstrap](#7-module-bootstrap)
8. [Testing](#8-testing)
9. [Future Enhancements (TODO)](#9-future-enhancements-todo)
10. [Changelog](#10-changelog)

---

## 1. Module Overview

The Finance module manages accounts (Chart of Accounts), journal entries, invoices (AR/AP), and financial reports.

**Key behaviors:**
- Double-entry bookkeeping enforcement (every journal entry must have balanced debits and credits)
- Automatic account code validation and hierarchy
- Invoice status tracking (DRAFT, PENDING, PAID, OVERDUE, CANCELLED)
- Financial report generation (Balance Sheet, Income Statement, Cash Flow)
- Tax calculations support
- Multi-currency support (future)

**Dependencies:**

| Dependency | Source | Purpose |
|---|---|---|
| `Result<T>`, `AggregateRoot`, `DomainEvent`, `PaginatedResult` | `@erp/shared/kernel` | Domain primitives |
| `IEventBus` | `@erp/core/event-bus` | Publishing domain events |
| `ApiResponse`, `validate` | `@erp/core/http` | HTTP responses + Zod middleware |
| `createAuthMiddleware`, `requirePermission` | `@erp/module/auth` | Auth & RBAC middleware |

---

## 2. API Endpoints

All routes are prefixed with `/v1/finance`. Every endpoint requires authentication via `Bearer` token.

### Account Routes (Chart of Accounts)

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/accounts` | `finance:accounts:write` | CreateAccountSchema | Create account (validate code uniqueness & parent) |
| GET | `/accounts` | `finance:accounts:read` | ListAccountsSchema | Paginated list (type, isActive filters) |
| GET | `/accounts/:id` | `finance:accounts:read` | — | Get by ID |
| PATCH | `/accounts/:id` | `finance:accounts:write` | UpdateAccountSchema | Update name/description |
| DELETE | `/accounts/:id` | `finance:accounts:delete` | — | Soft delete (check no journal entries) |

### Journal Entry Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/journal-entries` | `finance:journal-entries:write` | CreateJournalEntrySchema | Create entry with double-entry validation |
| GET | `/journal-entries` | `finance:journal-entries:read` | ListJournalEntriesSchema | Paginated list (date, account filters) |
| GET | `/journal-entries/:id` | `finance:journal-entries:read` | — | Get by ID with line items |
| PATCH | `/journal-entries/:id` | `finance:journal-entries:write` | UpdateJournalEntrySchema | Update description only (lines immutable) |
| POST | `/journal-entries/:id/reverse` | `finance:journal-entries:write` | ReverseJournalEntrySchema | Create reversing entry |

### Invoice Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/invoices` | `finance:invoices:write` | CreateInvoiceSchema | Create AR/AP invoice |
| GET | `/invoices` | `finance:invoices:read` | ListInvoicesSchema | Paginated list (type, status, date filters) |
| GET | `/invoices/:id` | `finance:invoices:read` | — | Get by ID with line items |
| PATCH | `/invoices/:id` | `finance:invoices:write` | UpdateInvoiceSchema | Update (only DRAFT status) |
| PATCH | `/invoices/:id/status` | `finance:invoices:write` | ChangeInvoiceStatusSchema | Change status (DRAFT→PENDING→PAID/CANCELLED) |
| POST | `/invoices/:id/payments` | `finance:invoices:write` | RecordPaymentSchema | Record payment |
| GET | `/invoices/:id/payments` | `finance:invoices:read` | — | List invoice payments |

### Report Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| GET | `/reports/balance-sheet` | `finance:reports:read` | BalanceSheetQuerySchema | Balance sheet as of date |
| GET | `/reports/income-statement` | `finance:reports:read` | IncomeStatementQuerySchema | P&L for period |
| GET | `/reports/cash-flow` | `finance:reports:read` | CashFlowQuerySchema | Cash flow statement |

---

## 3. Domain Layer ✅

> **Status:** ✅ Complete - All entities, value objects, events, and repository interfaces implemented

### 3.1 Entities

#### Account

**File:** `domain/entities/Account.ts`

**State:**
```typescript
interface AccountState {
  id: string;
  code: string;               // e.g., "1-1001" (Assets -> Current Assets -> Cash)
  name: string;
  description: string | null;
  type: AccountType;          // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentId: string | null;
  isActive: boolean;
  isSystemAccount: boolean;   // System accounts cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ code, name, description?, type, parentId? }` | `Result<Account>` | Records `finance.account.created` |
| `reconstitute()` | `AccountState` | `Account` | No events |
| `updateDetails()` | `{ name?, description? }` | `Result<void>` | Records `finance.account.updated` |
| `deactivate()` | — | `Result<void>` | Errors if system account or has journal entries |

---

#### JournalEntry

**File:** `domain/entities/JournalEntry.ts`

**State:**
```typescript
interface JournalEntryState {
  id: string;
  entryNumber: string;        // Auto-generated sequential
  date: Date;
  description: string;
  lineItems: JournalLineItem[];
  status: JournalEntryStatus; // DRAFT, POSTED, REVERSED
  postedAt: Date | null;
  postedBy: string | null;
  reversalEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalLineItem {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ date, description, lineItems[] }` | `Result<JournalEntry>` | Validates double-entry (debits = credits), records event |
| `reconstitute()` | `JournalEntryState` | `JournalEntry` | No events |
| `post()` | `postedBy` | `Result<void>` | Only from DRAFT status, records `finance.journal.posted` |
| `reverse()` | `{ reason, reversedBy }` | `Result<void>` | Only from POSTED status, records `finance.journal.reversed` |

---

#### Invoice

**File:** `domain/entities/Invoice.ts`

**State:**
```typescript
interface InvoiceState {
  id: string;
  invoiceNumber: string;      // Auto-generated
  type: InvoiceType;          // RECEIVABLE (AR), PAYABLE (AP)
  customerId: string;         // Customer or Vendor ID
  customerName: string;
  date: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;      // DRAFT, PENDING, PAID, OVERDUE, CANCELLED
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ type, customerId, customerName, date, dueDate, lineItems[] }` | `Result<Invoice>` | Auto-calc totals, records event |
| `reconstitute()` | `InvoiceState` | `Invoice` | No events |
| `update()` | `{ date?, dueDate?, lineItems[]? }` | `Result<void>` | Only DRAFT status |
| `validate()` | — | `Result<void>` | Transition DRAFT → PENDING, records `finance.invoice.validated` |
| `recordPayment()` | `{ amount, paymentDate, reference? }` | `Result<void>` | Updates paidAmount, may change status |
| `markAsPaid()` | — | `Result<void>` | Sets status PAID, records event |
| `cancel()` | `reason?` | `Result<void>` | Sets status CANCELLED, records event |
| `checkOverdue()` | — | `void` | Sets status OVERDUE if past dueDate and not paid |

---

#### Payment

**File:** `domain/entities/Payment.ts`

**State:**
```typescript
interface PaymentState {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod; // BANK_TRANSFER, CASH, CHECK, etc.
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}
```

**Methods:** `create()`, `reconstitute()`

---

### 3.2 Value Objects

| Value Object | File | Rules |
|---|---|---|
| `AccountCode` | `domain/value-objects/AccountCode.ts` | Format: X-XXXX (segment-separated), validates hierarchy |
| `AccountType` | `domain/value-objects/AccountType.ts` | ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE |
| `InvoiceType` | `domain/value-objects/InvoiceType.ts` | RECEIVABLE, PAYABLE |
| `InvoiceStatus` | `domain/value-objects/InvoiceStatus.ts` | DRAFT, PENDING, PAID, OVERDUE, CANCELLED |
| `JournalEntryStatus` | `domain/value-objects/JournalEntryStatus.ts` | DRAFT, POSTED, REVERSED |
| `Money` | `domain/value-objects/Money.ts` | Immutable, supports arithmetic operations, decimal precision |

---

### 3.3 Domain Events

| Event | Type | Properties |
|---|---|---|
| `AccountCreated` | `finance.account.created` | accountId, code, name |
| `AccountUpdated` | `finance.account.updated` | accountId, code |
| `JournalEntryPosted` | `finance.journal.posted` | entryId, entryNumber, date |
| `JournalEntryReversed` | `finance.journal.reversed` | entryId, reversalEntryId |
| `InvoiceCreated` | `finance.invoice.created` | invoiceId, invoiceNumber, type |
| `InvoiceValidated` | `finance.invoice.validated` | invoiceId, invoiceNumber, totalAmount |
| `InvoicePaid` | `finance.invoice.paid` | invoiceId, paymentId, amount |
| `InvoiceCancelled` | `finance.invoice.cancelled` | invoiceId, reason |
| `PaymentRecorded` | `finance.payment.recorded` | paymentId, invoiceId, amount |

---

### 3.4 Repository Interfaces

#### IAccountRepository
```typescript
interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findAll(filter: AccountFilter, pagination: PaginationInput): Promise<PaginatedResult<Account>>;
  findChildren(parentId: string): Promise<Account[]>;
  findRootAccounts(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  update(account: Account): Promise<void>;
  hasJournalEntries(accountId: string): Promise<boolean>;
}
// AccountFilter: { type?: AccountType; isActive?: boolean; search?: string }
```

#### IJournalEntryRepository
```typescript
interface IJournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  findByEntryNumber(entryNumber: string): Promise<JournalEntry | null>;
  findAll(filter: JournalEntryFilter, pagination: PaginationInput): Promise<PaginatedResult<JournalEntry>>;
  save(entry: JournalEntry): Promise<void>;
  update(entry: JournalEntry): Promise<void>;
  getNextEntryNumber(): Promise<string>;
}
// JournalEntryFilter: { status?: JournalEntryStatus; dateFrom?: Date; dateTo?: Date; accountId?: string }
```

#### IInvoiceRepository
```typescript
interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  findAll(filter: InvoiceFilter, pagination: PaginationInput): Promise<PaginatedResult<Invoice>>;
  save(invoice: Invoice): Promise<void>;
  update(invoice: Invoice): Promise<void>;
  getOutstandingInvoices(asOfDate: Date): Promise<Invoice[]>;
  getNextInvoiceNumber(type: InvoiceType): Promise<string>;
}
// InvoiceFilter: { type?: InvoiceType; status?: InvoiceStatus; customerId?: string; dateFrom?: Date; dateTo?: Date }
```

#### IPaymentRepository
```typescript
interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  getTotalPaidForInvoice(invoiceId: string): Promise<number>;
}
```

---

## 4. Application Layer

> **Status:** DTOs ✅ Complete | Use Cases ✅ Complete

### 4.1 DTOs & Validation Schemas ✅

| DTO | Fields |
|---|---|
| **CreateAccountSchema** | `code` (format X-XXXX), `name` (1-100), `description?` (max 500), `type` (enum), `parentId?` (uuid, must exist) |
| **UpdateAccountSchema** | `name?` (1-100), `description?` (max 500) |
| **ListAccountsSchema** | `page` (default 1), `limit` (default 20, max 100), `type?`, `isActive?` (boolean), `search?` |
| **CreateJournalEntrySchema** | `date` (date), `description` (1-500), `lineItems[]` (accountId, description, debitAmount >= 0, creditAmount >= 0) |
| **ListJournalEntriesSchema** | `page` (default 1), `limit` (default 20, max 100), `status?`, `dateFrom?`, `dateTo?`, `accountId?` |
| **UpdateJournalEntrySchema** | `description` (1-500) |
| **ReverseJournalEntrySchema** | `reason` (max 500) |
| **CreateInvoiceSchema** | `type` (RECEIVABLE/PAYABLE), `customerId` (uuid), `customerName` (1-100), `date` (date), `dueDate` (date), `lineItems[]`, `notes?` |
| **UpdateInvoiceSchema** | `date?` (date), `dueDate?` (date), `lineItems?`, `notes?` |
| **ListInvoicesSchema** | `page` (default 1), `limit` (default 20, max 100), `type?`, `status?`, `customerId?`, `dateFrom?`, `dateTo?` |
| **ChangeInvoiceStatusSchema** | `status` (enum: DRAFT/PENDING/PAID/CANCELLED) |
| **RecordPaymentSchema** | `amount` (> 0), `paymentDate` (date), `paymentMethod` (enum), `reference?`, `notes?` |
| **BalanceSheetQuerySchema** | `asOfDate` (date, default today) |
| **IncomeStatementQuerySchema** | `startDate`, `endDate`, `compareToPeriod?` |
| **CashFlowQuerySchema** | `startDate`, `endDate` |

---

### 4.2 Use Cases ✅

> **Status:** ✅ Complete - All 23 use cases implemented

**Files created:**
- ✅ `application/use-cases/account/CreateAccountUseCase.ts`
- ✅ `application/use-cases/account/GetAccountUseCase.ts`
- ✅ `application/use-cases/account/ListAccountsUseCase.ts`
- ✅ `application/use-cases/account/UpdateAccountUseCase.ts`
- ✅ `application/use-cases/account/DeleteAccountUseCase.ts`
- ✅ `application/use-cases/journal-entry/CreateJournalEntryUseCase.ts`
- ✅ `application/use-cases/journal-entry/GetJournalEntryUseCase.ts`
- ✅ `application/use-cases/journal-entry/ListJournalEntriesUseCase.ts`
- ✅ `application/use-cases/journal-entry/PostJournalEntryUseCase.ts`
- ✅ `application/use-cases/journal-entry/ReverseJournalEntryUseCase.ts`
- ✅ `application/use-cases/journal-entry/UpdateJournalEntryUseCase.ts`
- ✅ `application/use-cases/invoice/CreateInvoiceUseCase.ts`
- ✅ `application/use-cases/invoice/GetInvoiceUseCase.ts`
- ✅ `application/use-cases/invoice/ListInvoicesUseCase.ts`
- ✅ `application/use-cases/invoice/UpdateInvoiceUseCase.ts`
- ✅ `application/use-cases/invoice/ValidateInvoiceUseCase.ts`
- ✅ `application/use-cases/invoice/ChangeInvoiceStatusUseCase.ts`
- ✅ `application/use-cases/invoice/RecordPaymentUseCase.ts`
- ✅ `application/use-cases/invoice/GetInvoicePaymentsUseCase.ts`
- ✅ `application/use-cases/report/GenerateBalanceSheetUseCase.ts` (placeholder)
- ✅ `application/use-cases/report/GenerateIncomeStatementUseCase.ts` (placeholder)
- ✅ `application/use-cases/report/GenerateCashFlowUseCase.ts` (placeholder)

#### Account

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateAccountUseCase` | CreateAccountDTO | Account fields | Checks code uniqueness, validates parent, publishes events |
| `GetAccountUseCase` | `{ id }` | Account fields | — |
| `ListAccountsUseCase` | ListAccountsDTO | `{ items[], meta }` | — |
| `UpdateAccountUseCase` | `{ id, ...updates }` | Account fields | Publishes events |
| `DeleteAccountUseCase` | `{ id }` | — | Checks no journal entries, soft deletes |

#### Journal Entry

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateJournalEntryUseCase` | CreateJournalEntryDTO | JournalEntry fields | Auto-generates entry number, validates double-entry |
| `GetJournalEntryUseCase` | `{ id }` | JournalEntry fields | — |
| `ListJournalEntriesUseCase` | ListJournalEntriesDTO | `{ items[], meta }` | — |
| `PostJournalEntryUseCase` | `{ entryId, postedBy }` | JournalEntry fields | Updates status, publishes events |
| `ReverseJournalEntryUseCase` | `{ entryId, reason, reversedBy }` | New reversal entry | Creates reversing entry, publishes events |
| `UpdateJournalEntryUseCase` | `{ id, description }` | JournalEntry fields | Only DRAFT status |

#### Invoice

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateInvoiceUseCase` | CreateInvoiceDTO | Invoice fields | Auto-generates invoice number, calcs totals |
| `GetInvoiceUseCase` | `{ id }` | Invoice fields with payments | — |
| `ListInvoicesUseCase` | ListInvoicesDTO | `{ items[], meta }` | — |
| `UpdateInvoiceUseCase` | `{ id, ...updates }` | Invoice fields | Only DRAFT status |
| `ValidateInvoiceUseCase` | `{ invoiceId }` | Invoice fields | DRAFT → PENDING, publishes events |
| `ChangeInvoiceStatusUseCase` | `{ invoiceId, status }` | Invoice fields | Validates transitions, publishes events |
| `RecordPaymentUseCase` | `{ invoiceId, amount, ... }` | Payment fields | Creates payment, updates invoice, publishes events |
| `GetInvoicePaymentsUseCase` | `{ invoiceId }` | Payment[] | — |

#### Reports

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `GenerateBalanceSheetUseCase` | `{ asOfDate }` | BalanceSheetReport | Aggregates account balances |
| `GenerateIncomeStatementUseCase` | `{ startDate, endDate }` | IncomeStatementReport | Revenue - Expense, operating/net income |
| `GenerateCashFlowUseCase` | `{ startDate, endDate }` | CashFlowReport | Operating, investing, financing activities |

---

### 4.3 Tokens (DI)

```typescript
// application/tokens.ts
export const TOKENS = {
  AccountRepository:      Symbol('IAccountRepository'),
  JournalEntryRepository: Symbol('IJournalEntryRepository'),
  InvoiceRepository:      Symbol('IInvoiceRepository'),
  PaymentRepository:      Symbol('IPaymentRepository'),
  EntryNumberGenerator:   Symbol('IEntryNumberGenerator'),
  InvoiceNumberGenerator: Symbol('IInvoiceNumberGenerator'),
  EventBus:               Symbol('IEventBus'),
} as const;
```

---

## 5. Infrastructure Layer

> **Status:** Database ✅ Complete | Repositories ✅ Complete | HTTP Layer ⏳ Pending

### 5.1 Database Schema ✅

All tables are in the `finance` schema (PostgreSQL).

**Migration files:** `infrastructure/database/migrations/`

| Table | Migration | Key Columns |
|---|---|---|---|
| `finance.accounts` | 001_create_finance_schema | code (UNIQUE), parent_id (FK → finance.accounts), type, is_active, is_system_account, deleted_at (soft delete) |
| `finance.journal_entries` | 001_create_finance_schema | entry_number (UNIQUE), date, description, status, posted_at, reversal_entry_id (FK) |
| `finance.journal_line_items` | 001_create_finance_schema | entry_id (FK), account_id (FK), debit_amount, credit_amount |
| `finance.invoices` | 002_create_invoices | invoice_number (UNIQUE), type, customer_id, customer_name, date, due_date, sub_total, tax_amount, total_amount, paid_amount, status |
| `finance.invoice_line_items` | 002_create_invoices | invoice_id (FK), description, quantity, unit_price, tax_rate, total |
| `finance.payments` | 002_create_invoices | invoice_id (FK), amount, payment_date, payment_method, reference |

**Indexes:**
- `idx_accounts_code`, `idx_accounts_type`, `idx_accounts_parent`
- `idx_journal_entries_date`, `idx_journal_entries_status`
- `idx_journal_line_items_entry`, `idx_journal_line_items_account`
- `idx_invoices_number`, `idx_invoices_type`, `idx_invoices_status`, `idx_invoices_customer`, `idx_invoices_date`
- `idx_payments_invoice`

**Seeded data (001):** Default Chart of Accounts
- Assets: 1-1000 (Cash), 1-1100 (Accounts Receivable), 1-1200 (Inventory)
- Liabilities: 2-2000 (Accounts Payable), 2-2100 (Accrued Expenses)
- Equity: 3-3000 (Owner's Equity), 3-3100 (Retained Earnings)
- Revenue: 4-4000 (Sales Revenue), 4-4100 (Service Revenue)
- Expenses: 5-5000 (Cost of Goods Sold), 5-5100 (Operating Expenses)

---

### 5.2 HTTP Layer ⏳

> **Status:** ⏳ Pending - Implementation required

**Files to create:**
- `infrastructure/repositories/KyselyAccountRepository.ts`
- `infrastructure/repositories/KyselyJournalEntryRepository.ts`
- `infrastructure/repositories/KyselyInvoiceRepository.ts`
- `infrastructure/repositories/KyselyPaymentRepository.ts`
- `infrastructure/services/SequentialEntryNumberGenerator.ts`
- `infrastructure/services/InvoiceNumberGenerator.ts`
- `infrastructure/http/AccountController.ts`
- `infrastructure/http/JournalEntryController.ts`
- `infrastructure/http/InvoiceController.ts`
- `infrastructure/http/ReportController.ts`
- `infrastructure/http/FinanceRoutes.ts`
- `infrastructure/http/FinanceErrorMapper.ts`

| File | Purpose |
|---|---|
| `AccountController` | create, getById, list, update, delete |
| `JournalEntryController` | create, getById, list, update, post, reverse |
| `InvoiceController` | create, getById, list, update, changeStatus, recordPayment, getPayments |
| `ReportController` | balanceSheet, incomeStatement, cashFlow |
| `FinanceRoutes` | Route definitions with Swagger annotations |
| `FinanceErrorMapper` | Error code → HTTP status mapping |

**Pattern:** Controllers are not `@injectable()` (instantiated manually in FinanceModule). Error handling uses `mapFinanceError(code)` → `ApiResponse.error()`.

---

## 6. Error Handling

### Error Code Reference

**Account errors:**

| Code | HTTP | Message |
|---|---|---|
| `ACCOUNT_NOT_FOUND` | 404 | Account not found |
| `ACCOUNT_CODE_EXISTS` | 409 | Account code already exists |
| `ACCOUNT_CODE_INVALID` | 400 | Invalid account code format |
| `ACCOUNT_HAS_JOURNAL_ENTRIES` | 409 | Cannot delete account with journal entries |
| `ACCOUNT_IS_SYSTEM` | 409 | Cannot modify system account |
| `ACCOUNT_PARENT_NOT_FOUND` | 404 | Parent account not found |
| `ACCOUNT_CIRCULAR_REFERENCE` | 400 | Circular reference detected |

**Journal entry errors:**

| Code | HTTP | Message |
|---|---|---|
| `JOURNAL_ENTRY_NOT_FOUND` | 404 | Journal entry not found |
| `JOURNAL_ENTRY_ALREADY_POSTED` | 409 | Journal entry is already posted |
| `JOURNAL_ENTRY_NOT_POSTED` | 409 | Journal entry is not posted |
| `JOURNAL_ENTRY_ALREADY_REVERSED` | 409 | Journal entry is already reversed |
| `JOURNAL_ENTRY_UNBALANCED` | 400 | Journal entry is not balanced (debits ≠ credits) |
| `JOURNAL_ENTRY_NO_LINE_ITEMS` | 400 | Journal entry must have at least 2 line items |
| `JOURNAL_ENTRY_INVALID_ACCOUNT` | 400 | Invalid account in line item |

**Invoice errors:**

| Code | HTTP | Message |
|---|---|---|
| `INVOICE_NOT_FOUND` | 404 | Invoice not found |
| `INVOICE_NUMBER_EXISTS` | 409 | Invoice number already exists |
| `INVOICE_NOT_DRAFT` | 409 | Invoice is not in DRAFT status |
| `INVOICE_ALREADY_PENDING` | 409 | Invoice is already pending |
| `INVOICE_ALREADY_PAID` | 409 | Invoice is already paid |
| `INVOICE_OVERPAYMENT` | 400 | Payment amount exceeds outstanding balance |
| `INVOICE_NO_LINE_ITEMS` | 400 | Invoice must have at least 1 line item |
| `INVOICE_INVALID_STATUS_TRANSITION` | 400 | Invalid status transition |

**Payment errors:**

| Code | HTTP | Message |
|---|---|---|
| `PAYMENT_NOT_FOUND` | 404 | Payment not found |
| `PAYMENT_AMOUNT_INVALID` | 400 | Payment amount must be greater than zero |

**Fallback:** Any unmapped error code returns 500.

---

## 7. Module Bootstrap 🚧

> **Status:** 🚧 Placeholder - Basic structure created, full implementation pending

**File:** `FinanceModule.ts`

**Config:**
```typescript
interface FinanceModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}
```

**Register phase** (`register()`): Registers repository instances and services in tsyringe container.

**Bootstrap phase** (`bootstrap()`): Resolves dependencies, instantiates all use cases and controllers, creates routes.

**DI flow:**
```
register():
  KyselyAccountRepository       → TOKENS.AccountRepository
  KyselyJournalEntryRepository  → TOKENS.JournalEntryRepository
  KyselyInvoiceRepository       → TOKENS.InvoiceRepository
  KyselyPaymentRepository       → TOKENS.PaymentRepository
  SequentialEntryNumberGenerator → TOKENS.EntryNumberGenerator
  InvoiceNumberGenerator        → TOKENS.InvoiceNumberGenerator
  eventBus                       → TOKENS.EventBus

bootstrap():
  Resolve all repos + services from container
  Instantiate use cases
  Instantiate controllers
  createFinanceRoutes(accounts, journal, invoices, reports, auth, rbac)
```

---

## 8. Testing ⏳

> **Status:** ⏳ Pending - No tests implemented yet

**Test files location (to be created):**
- `domain/entities/__tests__/` — Entity unit tests (Account, JournalEntry, Invoice, Payment)
- `domain/value-objects/__tests__/` — Value object tests (AccountCode, AccountType, Money, etc.)
- `application/use-cases/*/__tests__/` — Use case tests with mock repos
- `tests/mocks/` — Mock implementations

**Pattern:** All mocks use in-memory Maps. Tests use `Result.isSuccess()/isFailure()` + `getValue()/getError()`.

---

## 9. Future Enhancements (TODO)

> **Note:** Items listed below are advanced features for future releases. Core module implementation (Use Cases, Repositories, Controllers) is still in progress.

### Core Implementation (Pending)

**Priority: HIGH** - Required for module to be functional:
- [x] Application Use Cases (23 total)
- [x] Kysely Repository Implementations (4)
- [x] Number Generator Services (2)
- [x] HTTP Controllers (4)
- [x] HTTP Routes with Swagger
- [x] Error Mapper implementation
- [x] FinanceModule bootstrap with all dependencies

**Priority: MEDIUM** - Required for completeness:
- [x] Unit tests for Domain layer
- [x] Integration tests for Use Cases
- [x] E2E tests for HTTP endpoints

---

### Advanced Features

### Multi-Currency Support
- Base currency configuration
- Exchange rate management
- Currency conversion on reports
- Multi-currency invoices

### Advanced Features
- Recurring invoices
- Invoice templates
- Credit notes
- Debit notes
- Budget management
- Cost center allocation
- Project-based accounting

### Integration
- Bank reconciliation
- Payment gateway integration
- Tax calculation integration (VAT, GST, etc.)
- Integration with HR for payroll accounting

### Reporting
- Aging reports (AR/AP)
- Trial balance
- General ledger
- Custom report builder
- Export to PDF/Excel
- Scheduled reports

### Audit & Compliance
- Audit trail for all financial transactions
- Transaction locking after period close
- Period closing (month-end, year-end)
- Tax report generation
- Compliance reports

### Analytics
- Cash flow forecasting
- Profitability analysis
- Expense trend analysis
- Revenue recognition
- Financial ratios & KPIs

---

## 10. Changelog

### 2026-05-07 - Swagger Documentation ✅

**Completed:**
- ✅ Created comprehensive OpenAPI 3.0 specification (swagger.yaml)
- ✅ Documented all 26 API endpoints across 4 resource groups
- ✅ Complete request/response schemas with examples
- ✅ Security schemes (JWT Bearer authentication)
- ✅ Parameter definitions and validation rules
- ✅ Error response mappings
- ✅ Report schemas (Balance Sheet, Income Statement, Cash Flow)

**API Endpoints Documented:**
- Accounts: POST, GET, GET /:id, PATCH /:id, DELETE /:id
- Journal Entries: POST, GET, GET /:id, PATCH /:id, POST /:id/post, POST /:id/reverse
- Invoices: POST, GET, GET /:id, PATCH /:id, POST /:id/validate, PATCH /:id/status, POST /:id/payments, GET /:id/payments
- Reports: GET /balance-sheet, GET /income-statement, GET /cash-flow

### 2026-05-07 - Testing Suite ✅

**Completed:**
- ✅ Unit Tests for Domain Layer (6 value objects + 4 entities)
  - AccountType, InvoiceType, InvoiceStatus, JournalEntryStatus, Money, AccountCode
  - Account, JournalEntry, Invoice, Payment entities
- ✅ Integration Tests for Use Cases (3 key use cases)
  - CreateAccountUseCase, CreateJournalEntryUseCase, CreateInvoiceUseCase
- ✅ Mock Infrastructure (7 mock classes)
  - MockEventBus, MockAccountRepository, MockJournalEntryRepository, MockInvoiceRepository, MockPaymentRepository
  - MockEntryNumberGenerator, MockInvoiceNumberGenerator
- ✅ E2E Tests for HTTP Endpoints
  - Account endpoints (CRUD)
  - Journal Entry endpoints (create, list, post)
  - Invoice endpoints (create, list, validate, payments)
  - Report endpoints (balance sheet, income statement, cash flow)

### 2026-05-07 - HTTP Layer ✅

**Completed:**
- ✅ Implemented HTTP Controllers (4)
  - `AccountController` - create, getById, list, update, delete
  - `JournalEntryController` - create, getById, list, update, post, reverse
  - `InvoiceController` - create, getById, list, update, validate, changeStatus, recordPayment, getPayments
  - `ReportController` - balanceSheet, incomeStatement, cashFlow
- ✅ Implemented FinanceRoutes with full Swagger documentation
- ✅ Implemented FinanceErrorMapper for error code to HTTP status mapping
- ✅ Updated FinanceModule bootstrap with all dependencies
- ✅ Exported HTTP components in index.ts

### 2026-05-06 - Infrastructure Layer (Repositories) ✅

**Completed:**
- ✅ Implemented all Kysely Repository Implementations (4)
  - `KyselyAccountRepository` - with filter, pagination, parent/child queries
  - `KyselyJournalEntryRepository` - with line items eager loading, date/account filters
  - `KyselyInvoiceRepository` - with line items eager loading, outstanding invoices
  - `KyselyPaymentRepository` - with total paid calculation
- ✅ Implemented Number Generator Services (2)
  - `SequentialEntryNumberGenerator` - JE-000001 format with transaction lock
  - `DatabaseInvoiceNumberGenerator` - INV-YYYYMMDD-#### for AR, BL-YYYYMMDD-#### for AP

### 2026-05-06 - Use Cases Implementation ✅

**Completed:**
- ✅ Implemented all Application Use Cases (23 total)
  - Account: Create, Get, List, Update, Delete (5)
  - Journal Entry: Create, Get, List, Update, Post, Reverse (6)
  - Invoice: Create, Get, List, Update, Validate, ChangeStatus, RecordPayment, GetPayments (8)
  - Reports: BalanceSheet, IncomeStatement, CashFlow (3 - placeholder logic)

### 2026-05-06 - Initial Foundation ✅

**Completed:**
- ✅ Created module structure and base files
- ✅ Implemented all Domain Value Objects (6)
- ✅ Implemented all Domain Entities (4)
- ✅ Implemented all Domain Events (10)
- ✅ Defined Repository Interfaces (4)
- ✅ Created all DTOs with Zod validation (13)
- ✅ Created database migrations (2) with default Chart of Accounts
- ✅ Updated tsconfig.base.json with finance module path
- ✅ Created FinanceModule.ts with placeholder routes
- ✅ Created comprehensive documentation

**Next Steps:**
- [x] Implement Kysely Repositories
- [x] Implement Number Generators
- [x] Implement HTTP Controllers and Routes
- [x] Write tests (Unit, Integration, E2E)
- [ ] Run tests and fix any issues
- [ ] Generate code coverage report
