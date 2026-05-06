# HR Module — Implementation Reference

## Table of Contents

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

---

## 1. Module Overview

The HR module manages employees, departments, leave types, leave balances, and leave applications.

**Key behaviors:**
- Creating an employee auto-creates a user account (auth module) with a generated password
- Leave applications check leave balances before approval
- Employee status can be changed via `PUT /employees/:id/status` (ACTIVE, INACTIVE, SUSPENDED, TERMINATED)
- Department activate/deactivate via `PUT /departments/:id/activate` and `PUT /departments/:id/deactivate`
- Leave balances visible via `GET /employees/:employeeId/leave-balances`

**Dependencies:**

| Dependency | Source | Purpose |
|---|---|---|
| `Result<T>`, `AggregateRoot`, `DomainEvent`, `PaginatedResult` | `@erp/shared/kernel` | Domain primitives |
| `IEventBus` | `@erp/core/event-bus` | Publishing domain events |
| `ApiResponse`, `validate` | `@erp/core/http` | HTTP responses + Zod middleware |
| `IUserAccountCreator`, `UserAccountCreator` | `@erp/module/auth` | Auto-create user accounts |
| `AUTH_TOKENS`, `createAuthMiddleware`, `requirePermission` | `@erp/module/auth` | Auth middleware |

---

## 2. API Endpoints

All routes are prefixed with `/v1/hr`. Every endpoint requires authentication via `Bearer` token.

### Employee Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/employees` | `hr:employees:write` | CreateEmployeeSchema | Create employee + auto user account |
| GET | `/employees` | `hr:employees:read` | ListEmployeesSchema | Paginated list (status, search filters) |
| GET | `/employees/:id` | `hr:employees:read` | — | Get by ID |
| PUT | `/employees/:id` | `hr:employees:write` | UpdateEmployeeSchema | Update personal details |
| PUT | `/employees/:id/status` | `hr:employees:write` | ChangeEmployeeStatusSchema | Change status (ACTIVE/INACTIVE/SUSPENDED/TERMINATED) |

### Leave Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/leaves` | `hr:leaves:write` | ApplyLeaveSchema | Apply for leave |
| GET | `/leaves` | `hr:leaves:read` | ListLeavesSchema | Paginated list (employee, status, date filters) |
| GET | `/leaves/:id` | `hr:leaves:read` | — | Get by ID |
| PUT | `/leaves/:id/approve` | `hr:leaves:approve` | ReviewLeaveSchema | Approve leave |
| PUT | `/leaves/:id/reject` | `hr:leaves:approve` | ReviewLeaveSchema | Reject leave |
| PUT | `/leaves/:id/cancel` | `hr:leaves:write` | — | Cancel leave |
| GET | `/employees/:employeeId/leave-balances` | `hr:leaves:read` | — | List leave balances for employee (year query param) |

### Department Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/departments` | `hr:departments:write` | CreateDepartmentSchema | Create department |
| GET | `/departments` | `hr:departments:read` | ListDepartmentsSchema | Paginated list (search, isActive filters) |
| GET | `/departments/:id` | `hr:departments:read` | — | Get by ID |
| PUT | `/departments/:id` | `hr:departments:write` | UpdateDepartmentSchema | Update name, description, head |
| PUT | `/departments/:id/activate` | `hr:departments:write` | — | Activate department |
| PUT | `/departments/:id/deactivate` | `hr:departments:write` | — | Deactivate department |

### Leave Type Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/leave-types` | `hr:leave-types:write` | CreateLeaveTypeSchema | Create leave type |
| GET | `/leave-types` | `hr:leave-types:read` | — | List all (no pagination) |

---

## 3. Domain Layer

### 3.1 Entities

#### Employee

**File:** `domain/entities/Employee.ts`

**State:**
```typescript
interface EmployeeState {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string | null;
  position: string | null;
  hireDate: Date;
  status: string;           // ACTIVE | INACTIVE | SUSPENDED | TERMINATED
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ employeeNumber, firstName, lastName, email, phone?, departmentId?, position?, hireDate, userId? }` | `Result<Employee>` | Records `hr.employee.created` event |
| `reconstitute()` | `EmployeeState` | `Employee` | No events |
| `updateDetails()` | `{ firstName?, lastName?, phone?, departmentId?, position? }` | `Result<void>` | Validates firstName/lastName non-empty |
| `changeStatus()` | `newStatus: string` | `Result<void>` | Records `hr.employee.status-changed` event |
| `linkUser()` | `userId: string` | `void` | Sets userId for auto-created auth accounts |

---

#### Department

**File:** `domain/entities/Department.ts`

**State:**
```typescript
interface DepartmentState {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ name, code, description?, headId? }` | `Result<Department>` | Uppercases code, records `hr.department.created` |
| `reconstitute()` | `DepartmentState` | `Department` | No events |
| `updateDetails()` | `{ name?, description?, headId? }` | `Result<void>` | Validates name non-empty |
| `deactivate()` | — | `Result<void>` | Errors if already inactive |
| `activate()` | — | `Result<void>` | Errors if already active |

---

#### Leave

**File:** `domain/entities/Leave.ts`

**State:**
```typescript
interface LeaveState {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: string;           // PENDING | APPROVED | REJECTED | CANCELLED
  approvedBy: string | null;
  approvedAt: Date | null;
  remarks: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ employeeId, leaveTypeId, startDate, endDate, totalDays, reason? }` | `Result<Leave>` | Records `hr.leave.applied` |
| `reconstitute()` | `LeaveState` | `Leave` | No events |
| `approve()` | `approvedBy, remarks?` | `Result<void>` | Only from PENDING |
| `reject()` | `rejectedBy, remarks?` | `Result<void>` | Only from PENDING |
| `cancel()` | — | `Result<void>` | Only from PENDING or APPROVED |

---

#### LeaveType

**File:** `domain/entities/LeaveType.ts`

**State:** id, name, code, description, defaultDays, isPaid, isActive, createdAt, updatedAt

**Methods:** `create()`, `reconstitute()`, `update()`

---

#### LeaveBalance

**File:** `domain/entities/LeaveBalance.ts`

**State:** id, employeeId, leaveTypeId, year, totalDays, usedDays, remainingDays, createdAt, updatedAt

**Methods:**

| Method | Notes |
|---|---|
| `create()` | Sets remainingDays = totalDays, records event |
| `use(days)` | Deducts from remaining, adds to used. Errors if insufficient |
| `restore(days)` | Reverses a use operation |

---

### 3.2 Value Objects

| Value Object | File | Rules |
|---|---|---|
| `EmployeeNumber` | `domain/value-objects/EmployeeNumber.ts` | Format validation |
| `PhoneNumber` | `domain/value-objects/PhoneNumber.ts` | Optional, format validation |
| `EmployeeStatus` | `domain/value-objects/EmployeeStatus.ts` | ACTIVE, INACTIVE, SUSPENDED, TERMINATED |
| `LeaveStatus` | `domain/value-objects/LeaveStatus.ts` | PENDING, APPROVED, REJECTED, CANCELLED |
| `DateRange` | `domain/value-objects/DateRange.ts` | start < end, calculates totalDays |

---

### 3.3 Domain Events

All events follow naming convention: `hr.<entity>.<action>`

| Event | Type | Properties |
|---|---|---|
| `EmployeeCreated` | `hr.employee.created` | employeeId, employeeNumber, email |
| `EmployeeStatusChanged` | `hr.employee.status-changed` | employeeId, status |
| `DepartmentCreated` | `hr.department.created` | departmentId, code |
| `LeaveApplied` | `hr.leave.applied` | leaveId, employeeId, leaveTypeId |
| `LeaveApproved` | `hr.leave.approved` | leaveId, employeeId, approvedBy |
| `LeaveRejected` | `hr.leave.rejected` | leaveId, employeeId, rejectedBy |
| `LeaveCancelled` | `hr.leave.cancelled` | leaveId, employeeId |

---

### 3.4 Repository Interfaces

#### IEmployeeRepository
```typescript
interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findAll(filter: EmployeeFilter, pagination: PaginationInput): Promise<PaginatedResult<Employee>>;
  save(employee: Employee): Promise<void>;
  update(employee: Employee): Promise<void>;
}
// EmployeeFilter: { status?: string; search?: string }
// PaginationInput: { page: number; limit: number }
```

#### IDepartmentRepository
```typescript
interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  findByCode(code: string): Promise<Department | null>;
  findAll(filter: DepartmentFilter, pagination: PaginationInput): Promise<PaginatedResult<Department>>;
  save(department: Department): Promise<void>;
  update(department: Department): Promise<void>;
}
// DepartmentFilter: { search?: string; isActive?: boolean }
```

#### ILeaveRepository
```typescript
interface ILeaveRepository {
  findById(id: string): Promise<Leave | null>;
  findAll(filter: LeaveFilter, pagination: PaginationInput): Promise<PaginatedResult<Leave>>;
  save(leave: Leave): Promise<void>;
  update(leave: Leave): Promise<void>;
}
// LeaveFilter: { employeeId?: string; status?: string; startDateFrom?: Date; startDateTo?: Date }
```

#### ILeaveTypeRepository
```typescript
interface ILeaveTypeRepository {
  findById(id: string): Promise<LeaveType | null>;
  findByCode(code: string): Promise<LeaveType | null>;
  findAll(): Promise<LeaveType[]>;
  save(leaveType: LeaveType): Promise<void>;
  update(leaveType: LeaveType): Promise<void>;
}
```

#### ILeaveBalanceRepository
```typescript
interface ILeaveBalanceRepository {
  findById(id: string): Promise<LeaveBalance | null>;
  findByEmployeeAndTypeAndYear(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null>;
  findByEmployeeAndYear(employeeId: string, year: number): Promise<LeaveBalance[]>;
  save(balance: LeaveBalance): Promise<void>;
  update(balance: LeaveBalance): Promise<void>;
}
```

---

## 4. Application Layer

### 4.1 DTOs & Validation Schemas

All DTOs use Zod schemas. The `validate()` middleware parses `req.body`, strips unknown keys, and applies defaults.

| DTO | Fields |
|---|---|
| **CreateEmployeeSchema** | `firstName` (1-100), `lastName` (1-100), `email`, `phone?`, `departmentId?` (uuid), `position?` (max 100), `hireDate` (coerced date) |
| **UpdateEmployeeSchema** | `firstName?` (1-100), `lastName?` (1-100), `phone?`, `departmentId?` (uuid, nullable), `position?` (max 100) |
| **ListEmployeesSchema** | `page` (default 1), `limit` (default 20, max 100), `status?` (ACTIVE/INACTIVE/SUSPENDED/TERMINATED), `search?` |
| **ChangeEmployeeStatusSchema** | `status` (enum: ACTIVE/INACTIVE/SUSPENDED/TERMINATED) |
| **CreateDepartmentSchema** | `name` (1-100), `code` (1-20), `description?` (max 500), `headId?` (uuid) |
| **UpdateDepartmentSchema** | `name?` (1-100), `description?` (max 500, nullable), `headId?` (uuid, nullable) |
| **ListDepartmentsSchema** | `page` (default 1), `limit` (default 20, max 100), `search?`, `isActive?` (boolean) |
| **ApplyLeaveSchema** | `employeeId?` (uuid), `leaveTypeId` (uuid), `startDate` (date), `endDate` (date), `reason` (1-500) |
| **ReviewLeaveSchema** | `remarks?` (max 500) |
| **ListLeavesSchema** | `page` (default 1), `limit` (default 20, max 100), `employeeId?` (uuid), `status?` (PENDING/APPROVED/REJECTED/CANCELLED), `startDateFrom?` (date), `startDateTo?` (date) |
| **CreateLeaveTypeSchema** | `name` (1-50), `code` (1-20), `description?` (max 500), `defaultDays` (int >= 0), `isPaid` (default true) |

---

### 4.2 Use Cases

#### Employee

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateEmployeeUseCase` | CreateEmployeeDTO | `{ ...fields, userId, temporaryPassword }` | Creates auth user account, publishes events |
| `GetEmployeeUseCase` | `{ id }` | Employee fields | — |
| `ListEmployeesUseCase` | ListEmployeesDTO | `{ items[], meta }` | — |
| `UpdateEmployeeUseCase` | `{ id, ...updates }` | Employee fields | Publishes events |
| `ChangeEmployeeStatusUseCase` | `{ id, status }` | Employee fields | Publishes events |

#### Leave

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `ApplyLeaveUseCase` | ApplyLeaveDTO + employeeId | Leave fields | Creates/updates leave balance, publishes events |
| `GetLeaveUseCase` | `{ id }` | Leave fields | — |
| `ListLeavesUseCase` | ListLeavesDTO | `{ items[], meta }` | — |
| `ApproveLeaveUseCase` | `{ leaveId, approvedBy, remarks? }` | Leave fields | Publishes events |
| `RejectLeaveUseCase` | `{ leaveId, rejectedBy, remarks? }` | Leave fields | Restores leave balance, publishes events |
| `CancelLeaveUseCase` | `{ leaveId }` | Leave fields | Restores leave balance, publishes events |

#### Leave Balance

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `GetEmployeeLeaveBalancesUseCase` | `{ employeeId, year? }` | Balance[] (defaults to current year) | — |

#### Department

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateDepartmentUseCase` | CreateDepartmentDTO | Department fields | Checks code uniqueness, publishes events |
| `GetDepartmentUseCase` | `{ id }` | Department fields | — |
| `ListDepartmentsUseCase` | ListDepartmentsDTO | `{ items[], meta }` | — |
| `UpdateDepartmentUseCase` | `{ id, ...updates }` | Department fields | — |
| `ChangeDepartmentStatusUseCase` | `{ id, action: 'activate' \| 'deactivate' }` | Department fields | — |

#### Leave Type

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateLeaveTypeUseCase` | CreateLeaveTypeDTO | LeaveType fields | Checks code uniqueness |
| `ListLeaveTypesUseCase` | — | LeaveType[] | — |

---

### 4.3 Tokens (DI)

```typescript
// application/tokens.ts
export const TOKENS = {
  EmployeeRepository:      Symbol('IEmployeeRepository'),
  DepartmentRepository:    Symbol('IDepartmentRepository'),
  LeaveTypeRepository:     Symbol('ILeaveTypeRepository'),
  LeaveBalanceRepository:  Symbol('ILeaveBalanceRepository'),
  LeaveRepository:         Symbol('ILeaveRepository'),
  EmployeeNumberGenerator: Symbol('IEmployeeNumberGenerator'),
  UserAccountCreator:      Symbol('IUserAccountCreator'),
  EventBus:                Symbol('IEventBus'),
} as const;
```

---

## 5. Infrastructure Layer

### 5.1 Database Schema

All tables are in the `hr` schema (PostgreSQL).

**Migration files:** `infrastructure/database/migrations/`

| Table | Migration | Key Columns |
|---|---|---|
| `hr.employees` | 001_create_hr_schema | employee_number (UNIQUE), email (UNIQUE), department_id (FK → hr.departments), user_id (FK → auth.users), deleted_at (soft delete) |
| `hr.departments` | 002_create_departments | name (UNIQUE), code (UNIQUE), head_id (FK → hr.employees), is_active |
| `hr.leave_types` | 001_create_hr_schema | name (UNIQUE), code (UNIQUE), default_days, is_paid, is_active |
| `hr.leave_balances` | 001_create_hr_schema | employee_id + leave_type_id + year (UNIQUE), total_days, used_days, remaining_days |
| `hr.leaves` | 001_create_hr_schema | employee_id, leave_type_id, start_date, end_date, total_days, status, approved_by |

**Indexes:**
- `idx_employees_user_id`, `idx_employees_status`
- `idx_departments_code`
- `idx_leave_balances_employee` (employee_id, year)
- `idx_leaves_employee`, `idx_leaves_status`, `idx_leaves_date_range`

**Seeded data (001):** 5 leave types — ANNUAL, SICK, MATERNITY, PATERNITY, UNPAID

**Column mapping:** DB uses snake_case, entities use camelCase. Repositories handle mapping in `toEntity()`.

---

### 5.2 HTTP Layer

| File | Purpose |
|---|---|
| `EmployeeController` | create, getById, list, update, changeStatus |
| `LeaveController` | apply, getById, list, approve, reject, cancel, getBalances |
| `DepartmentController` | create, getById, list, update, activate, deactivate |
| `LeaveTypeController` | create, list |
| `HrRoutes` | Route definitions with Swagger annotations |
| `HrErrorMapper` | Error code → HTTP status mapping |

**Pattern:** Controllers are not `@injectable()` (instantiated manually in HRModule). Error handling uses `mapHrError(code)` → `ApiResponse.error()`.

**GET endpoint note:** `validate()` middleware puts parsed query params on `req.body`. Controllers read `req.body` first, fallback to `req.query`.

---

## 6. Error Handling

### Error Code Reference

**Employee errors:**

| Code | HTTP | Message |
|---|---|---|
| `EMPLOYEE_NOT_FOUND` | 404 | Employee not found |
| `EMPLOYEE_EMAIL_EXISTS` | 409 | Employee with this email already exists |
| `EMPLOYEE_NOT_ACTIVE` | 400 | Employee is not active |
| `FIRST_NAME_REQUIRED` | 400 | First name is required |
| `LAST_NAME_REQUIRED` | 400 | Last name is required |
| `HIRE_DATE_REQUIRED` | 400 | Hire date is required |
| `INVALID_EMPLOYEE_STATUS` | 400 | Invalid employee status |

**Department errors:**

| Code | HTTP | Message |
|---|---|---|
| `DEPARTMENT_NOT_FOUND` | 404 | — |
| `DEPARTMENT_CODE_EXISTS` | 409 | — |
| `DEPARTMENT_NAME_REQUIRED` | 400 | — |
| `DEPARTMENT_CODE_REQUIRED` | 400 | — |
| `DEPARTMENT_ALREADY_INACTIVE` | 409 | — |
| `DEPARTMENT_ALREADY_ACTIVE` | 409 | — |

**Leave errors:**

| Code | HTTP | Message |
|---|---|---|
| `LEAVE_NOT_FOUND` | 404 | Leave not found |
| `LEAVE_ALREADY_PROCESSED` | 409 | Leave has already been processed |
| `LEAVE_CANNOT_CANCEL` | 409 | Leave cannot be cancelled |
| `INVALID_TOTAL_DAYS` | 400 | — |

**Leave type errors:**

| Code | HTTP | Message |
|---|---|---|
| `LEAVE_TYPE_NOT_FOUND` | 404 | Leave type not found |
| `LEAVE_TYPE_CODE_EXISTS` | 409 | Leave type code already exists |
| `LEAVE_TYPE_NAME_REQUIRED` | 400 | Leave type name is required |
| `LEAVE_TYPE_CODE_REQUIRED` | 400 | Leave type code is required |
| `LEAVE_TYPE_INVALID_DAYS` | 400 | Invalid default days |

**Leave balance errors:**

| Code | HTTP | Message |
|---|---|---|
| `INSUFFICIENT_LEAVE_BALANCE` | 400 | Insufficient leave balance |
| `LEAVE_BALANCE_INVALID_DAYS` | 400 | Invalid leave balance days |

**General:** `INVALID_DATE_RANGE` → 400

**Fallback:** Any unmapped error code returns 500.

---

## 7. Module Bootstrap

**File:** `HRModule.ts`

**Config:**
```typescript
interface HRModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}
```

**Register phase** (`register()`): Registers repository instances and services in tsyringe container.

**Bootstrap phase** (`bootstrap()`): Resolves dependencies, instantiates all use cases and controllers, creates routes.

**DI flow:**
```
register():
  KyselyEmployeeRepository    → TOKENS.EmployeeRepository
  KyselyDepartmentRepository  → TOKENS.DepartmentRepository
  KyselyLeaveTypeRepository   → TOKENS.LeaveTypeRepository
  KyselyLeaveBalanceRepository → TOKENS.LeaveBalanceRepository
  KyselyLeaveRepository       → TOKENS.LeaveRepository
  SequentialEmployeeNumberGenerator → TOKENS.EmployeeNumberGenerator
  UserAccountCreator (from auth)    → TOKENS.UserAccountCreator
  eventBus                          → TOKENS.EventBus

bootstrap():
  Resolve all repos + services from container
  Instantiate 15 use cases
  Instantiate 4 controllers
  createHrRoutes(employee, leave, leaveType, department, auth, rbac)
```

---

## 8. Testing

**28 test suites, ~178 tests** (as of last update)

**Test files location:**
- `domain/entities/__tests__/` — Entity unit tests (Employee, Leave, Department, LeaveType, LeaveBalance)
- `domain/value-objects/__tests__/` — Value object tests (EmployeeNumber, PhoneNumber, EmployeeStatus, LeaveStatus, DateRange)
- `application/use-cases/*/__tests__/` — Use case tests with mock repos
- `tests/mocks/` — Mock implementations (MockEmployeeRepository, MockDepartmentRepository, MockLeaveRepository, MockLeaveTypeRepository, MockLeaveBalanceRepository, MockEmployeeNumberGenerator, MockEventBus)

**Pattern:** All mocks use in-memory Maps. Tests use `Result.isSuccess()/isFailure()` + `getValue()/getError()` (not `.value`/`.error`).
