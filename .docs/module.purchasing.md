# Purchasing Module — Implementation Reference

## Implementation Status

> **Last Updated:** 2026-05-07
> **Version:** 1.0.0-alpha
> **Status:** 📝 Planning Phase

### ⏳ Planned Implementation

| Layer | Component | Status |
|-------|-----------|--------|
| **Domain** | Value Objects | ⏳ Pending |
| **Domain** | Entities | ⏳ Pending |
| **Domain** | Events | ⏳ Pending |
| **Domain** | Repository Interfaces | ⏳ Pending |
| **Application** | DTOs & Validation Schemas | ⏳ Pending |
| **Application** | Use Cases | ⏳ Pending |
| **Infrastructure** | Database Migrations | ⏳ Pending |
| **Infrastructure** | Kysely Repositories | ⏳ Pending |
| **Infrastructure** | Number Generators | ⏳ Pending |
| **Infrastructure** | HTTP Controllers | ⏳ Pending |
| **Module** | Bootstrap | ⏳ Pending |

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
9. [Integration Points](#9-integration-points)
10. [Future Enhancements (TODO)](#10-future-enhancements-todo)

---

## 1. Module Overview

The Purchasing module manages the complete procurement lifecycle from purchase requisition to goods receipt and vendor payment.

**Key behaviors:**
- Purchase Requisition (PR) creation and approval workflow
- Purchase Order (PO) generation from approved PRs
- Vendor/Supplier management with performance tracking
- Request for Quotation (RFQ) management
- Goods Receipt and quality inspection
- Purchase Returns and vendor claims
- Budget validation and control
- Multi-level approval workflows

**Module Dependencies:**

| Dependency | Source | Purpose |
|---|---|---|
| `Result<T>`, `AggregateRoot`, `DomainEvent`, `PaginatedResult` | `@erp/shared/kernel` | Domain primitives |
| `IEventBus` | `@erp/core/event-bus` | Publishing domain events |
| `ApiResponse`, `validate` | `@erp/core/http` | HTTP responses + Zod middleware |
| `createAuthMiddleware`, `requirePermission` | `@erp/module/auth` | Auth & RBAC middleware |
| - | `@erp/module/inventory` | Product catalog, stock updates |
| - | `@erp/module/finance` | Budget validation, invoice generation |

**Events Published:**

| Event | Consumed By | Purpose |
|---|---|---|
| `purchasing.pr.created` | - | PR created notification |
| `purchasing.pr.approved` | Inventory | Reserve stock if needed |
| `purchasing.po.created` | Finance | Budget reservation |
| `purchasing.po.approved` | Finance | Send to vendor |
| `purchasing.goods-receipt.received` | Inventory | Update stock levels |
| `purchasing.goods-receipt.received` | Finance | Accrue liability |
| `purchasing.vendor.created` | Finance | Vendor master data |

**Events Subscribed:**

| Event | Source | Action |
|---|---|---|
| `inventory.product.created` | Inventory | Add to purchasable items |
| `finance.budget.approved` | Finance | Enable budget validation |
| `hr.employee.created` | HR | Add as potential requestor |

---

## 2. API Endpoints

All routes are prefixed with `/v1/purchasing`. Every endpoint requires authentication via `Bearer` token.

### Purchase Requisition Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/purchase-requisitions` | `purchasing:pr:write` | CreatePRSchema | Create new purchase requisition |
| GET | `/purchase-requisitions` | `purchasing:pr:read` | ListPRSchema | Paginated list (status, department, date filters) |
| GET | `/purchase-requisitions/:id` | `purchasing:pr:read` | — | Get by ID with line items |
| PATCH | `/purchase-requisitions/:id` | `purchasing:pr:write` | UpdatePRSchema | Update (only DRAFT status) |
| POST | `/purchase-requisitions/:id/submit` | `purchasing:pr:write` | — | Submit for approval |
| POST | `/purchase-requisitions/:id/approve` | `purchasing:pr:approve` | ApproveRejectSchema | Approve PR |
| POST | `/purchase-requisitions/:id/reject` | `purchasing:pr:approve` | ApproveRejectSchema | Reject PR |
| POST | `/purchase-requisitions/:id/cancel` | `purchasing:pr:write` | — | Cancel PR |
| GET | `/purchase-requisitions/:id/history` | `purchasing:pr:read` | — | Get approval history |

### Purchase Order Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/purchase-orders` | `purchasing:po:write` | CreatePOSchema | Create PO (from PR or direct) |
| GET | `/purchase-orders` | `purchasing:po:read` | ListPOSchema | Paginated list (status, vendor, date filters) |
| GET | `/purchase-orders/:id` | `purchasing:po:read` | — | Get by ID with line items |
| PATCH | `/purchase-orders/:id` | `purchasing:po:write` | UpdatePOSchema | Update (only DRAFT status) |
| POST | `/purchase-orders/:id/submit` | `purchasing:po:write` | — | Submit for approval |
| POST | `/purchase-orders/:id/approve` | `purchasing:po:approve` | ApproveRejectSchema | Approve PO |
| POST | `/purchase-orders/:id/reject` | `purchasing:po:approve` | ApproveRejectSchema | Reject PO |
| POST | `/purchase-orders/:id/cancel` | `purchasing:po:write` | — | Cancel PO |
| POST | `/purchase-orders/:id/send` | `purchasing:po:write` | — | Mark as sent to vendor |
| GET | `/purchase-orders/:id/history` | `purchasing:po:read` | — | Get approval history |

### Vendor Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/vendors` | `purchasing:vendors:write` | CreateVendorSchema | Create new vendor |
| GET | `/vendors` | `purchasing:vendors:read` | ListVendorSchema | Paginated list (isActive, type filters) |
| GET | `/vendors/:id` | `purchasing:vendors:read` | — | Get by ID |
| PATCH | `/vendors/:id` | `purchasing:vendors:write` | UpdateVendorSchema | Update vendor details |
| DELETE | `/vendors/:id` | `purchasing:vendors:delete` | — | Soft delete (check no active POs) |
| POST | `/vendors/:id/activate` | `purchasing:vendors:write` | — | Activate vendor |
| POST | `/vendors/:id/deactivate` | `purchasing:vendors:write` | — | Deactivate vendor |
| GET | `/vendors/:id/performance` | `purchasing:vendors:read` | — | Get vendor performance metrics |
| POST | `/vendors/:id/rating` | `purchasing:vendors:write` | VendorRatingSchema | Rate vendor performance |

### RFQ Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/rfqs` | `purchasing:rfq:write` | CreateRFQSchema | Create RFQ |
| GET | `/rfqs` | `purchasing:rfq:read` | ListRFQSchema | Paginated list (status, date filters) |
| GET | `/rfqs/:id` | `purchasing:rfq:read` | — | Get by ID with quotations |
| POST | `/rfqs/:id/quotations` | `purchasing:rfq:write` | SubmitQuotationSchema | Submit vendor quotation |
| POST | `/rfqs/:id/close` | `purchasing:rfq:write` | CloseRFQSchema | Close RFQ and select winner |
| GET | `/rfqs/:id/quotations` | `purchasing:rfq:read` | — | Get all quotations |

### Goods Receipt Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/goods-receipts` | `purchasing:gr:write` | CreateGRSchema | Create goods receipt |
| GET | `/goods-receipts` | `purchasing:gr:read` | ListGRSchema | Paginated list (status, date filters) |
| GET | `/goods-receipts/:id` | `purchasing:gr:read` | — | Get by ID with items |
| POST | `/goods-receipts/:id/inspect` | `purchasing:gr:write` | InspectionSchema | Record inspection results |
| POST | `/goods-receipts/:id/complete` | `purchasing:gr:write` | — | Mark as completed (updates inventory) |
| POST | `/goods-receipts/:id/reject` | `purchasing:gr:write` | RejectSchema | Reject delivery to vendor |

### Purchase Return Routes

| Method | Path | Permission | Validation | Summary |
|---|---|---|---|---|
| POST | `/purchase-returns` | `purchasing:returns:write` | CreateReturnSchema | Create purchase return |
| GET | `/purchase-returns` | `purchasing:returns:read` | ListReturnSchema | Paginated list |
| GET | `/purchase-returns/:id` | `purchasing:returns:read` | — | Get by ID |
| POST | `/purchase-returns/:id/approve` | `purchasing:returns:approve` | — | Approve return |
| GET | `/purchase-returns/:id/credit-note` | `purchasing:returns:read` | — | Get associated credit note |

---

## 3. Domain Layer

### 3.1 Entities

#### PurchaseRequisition

**File:** `domain/entities/PurchaseRequisition.ts`

**State:**
```typescript
interface PurchaseRequisitionState {
  id: string;
  prNumber: string;             // Auto-generated: PR-YYYYMMDD-####
  requestorId: string;          // Employee ID
  requestorName: string;
  departmentId: string;
  departmentName: string;
  requestedDate: Date;
  requiredDate: Date;
  lineItems: PRLineItem[];
  totalAmount: number;
  status: PRStatus;             // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED, PROCESSED
  currentApprovalLevel: number;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PRLineItem {
  id: string;
  productId: string | null;     // null if custom item
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  vendorId: string | null;      // Suggested vendor
  reason: string | null;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ requestorId, departmentId, requestedDate, requiredDate, lineItems[] }` | `Result<PurchaseRequisition>` | Records event |
| `reconstitute()` | `PurchaseRequisitionState` | `PurchaseRequisition>` | No events |
| `update()` | `{ requestedDate?, requiredDate?, lineItems[]?, notes? }` | `Result<void>` | Only DRAFT status |
| `submit()` | — | `Result<void>` | DRAFT → PENDING_APPROVAL |
| `approve()` | `{ approverId, remarks? }` | `Result<void>` | Advances approval level |
| `reject()` | `{ rejectorId, reason }` | `Result<void>` | Sets REJECTED status |
| `cancel()` | `{ cancellerId, reason }` | `Result<void>` | From PENDING or APPROVED |
| `markProcessed()` | — | `Result<void>` | When PO created |

---

#### PurchaseOrder

**File:** `domain/entities/PurchaseOrder.ts`

**State:**
```typescript
interface PurchaseOrderState {
  id: string;
  poNumber: string;             // Auto-generated: PO-YYYYMMDD-####
  prId: string | null;          // Source PR if created from PR
  prNumber: string | null;
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  lineItems: POLineItem[];
  subTotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;             // Default: IDR
  status: POStatus;             // DRAFT, PENDING_APPROVAL, APPROVED, SENT, PARTIAL_RECEIPT, RECEIVED, CANCELLED
  currentApprovalLevel: number;
  paymentTermId: string | null;
  paymentTermDays: number;
  shippingAddress: string;
  notes: string | null;
  internalNotes: string | null;
  rejectionReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface POLineItem {
  id: string;
  prLineItemId: string | null;
  productId: string | null;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  total: number;
  receivedQty: number;
  rejectedQty: number;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ vendorId, orderDate, expectedDeliveryDate, lineItems[] }` | `Result<PurchaseOrder>` | Records event |
| `createFromPR()` | `{ pr, vendorId, ... }` | `Result<PurchaseOrder>` | Links to PR |
| `reconstitute()` | `PurchaseOrderState` | `PurchaseOrder>` | No events |
| `update()` | `{ expectedDeliveryDate?, lineItems[]?, notes? }` | `Result<void>` | Only DRAFT status |
| `submit()` | — | `Result<void>` | DRAFT → PENDING_APPROVAL |
| `approve()` | `{ approverId, remarks? }` | `Result<void>` | Advances approval level |
| `reject()` | `{ rejectorId, reason }` | `Result<void>` | Sets REJECTED status |
| `cancel()` | `{ cancellerId, reason }` | `Result<void>` | From PENDING or APPROVED |
| `markSent()` | — | `Result<void>` | APPROVED → SENT |
| `updateReceivedQty()` | `{ lineItemId, qty }` | `Result<void>` | Update from goods receipt |

---

#### Vendor

**File:** `domain/entities/Vendor.ts`

**State:**
```typescript
interface VendorState {
  id: string;
  vendorCode: string;           // Auto-generated: V-####
  name: string;
  type: VendorType;             // GOODS, SERVICES, BOTH
  taxId: string | null;
  email: string;
  phone: string;
  website: string | null;
  billingAddress: Address;
  shippingAddress: Address;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  paymentTermId: string | null;
  defaultPaymentTermDays: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  rating: number;               // 1-5 average rating
  isActive: boolean;
  isBlocked: boolean;           // Blocked for new purchases
  blockReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Address {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ name, type, email, phone, ... }` | `Result<Vendor>` | Records event |
| `reconstitute()` | `VendorState` | `Vendor>` | No events |
| `update()` | `{ ...fields }` | `Result<void>` | Records event |
| `activate()` | — | `Result<void>` | Sets isActive = true |
| `deactivate()` | — | `Result<void>` | Sets isActive = false |
| `block()` | `reason` | `Result<void>` | Sets isBlocked = true |
| `unblock()` | — | `Result<void>` | Sets isBlocked = false |
| `updateRating()` | `newRating` | `Result<void>` | Recalculates average |

---

#### RequestForQuotation

**File:** `domain/entities/RequestForQuotation.ts`

**State:**
```typescript
interface RequestForQuotationState {
  id: string;
  rfqNumber: string;            // Auto-generated: RFQ-YYYYMMDD-####
  prId: string | null;
  title: string;
  description: string;
  items: RFQItem[];
  invitedVendors: string[];     // Vendor IDs
  quotations: Quotation[];
  status: RFQStatus;            // DRAFT, PUBLISHED, CLOSED, CANCELLED
  publishedAt: Date | null;
  closedAt: Date | null;
  winnerVendorId: string | null;
  winnerQuotationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RFQItem {
  id: string;
  productId: string | null;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  technicalSpecs: string | null;
}

interface Quotation {
  id: string;
  vendorId: string;
  vendorName: string;
  submittedAt: Date;
  items: QuotationItem[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  validityDays: number;
  notes: string | null;
  isSelected: boolean;
}

interface QuotationItem {
  rfqItemId: string;
  unitPrice: number;
  total: number;
  notes: string | null;
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ title, items[], invitedVendors[] }` | `Result<RequestForQuotation>` | Records event |
| `reconstitute()` | `RequestForQuotationState` | `RequestForQuotation>` | No events |
| `publish()` | — | `Result<void>` | DRAFT → PUBLISHED |
| `submitQuotation()` | `{ vendorId, items[], ... }` | `Result<void>` | Add vendor quotation |
| `close()` | `{ winnerQuotationId }` | `Result<void>` | Select winner, close RFQ |
| `cancel()` | `reason` | `Result<void>` | Cancel RFQ |

---

#### GoodsReceipt

**File:** `domain/entities/GoodsReceipt.ts`

**State:**
```typescript
interface GoodsReceiptState {
  id: string;
  grNumber: string;             // Auto-generated: GR-YYYYMMDD-####
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  receivedDate: Date;
  receivedBy: string;
  items: GRItem[];
  status: GRStatus;             // PENDING_INSPECTION, INSPECTED, PARTIAL_ACCEPTED, ACCEPTED, REJECTED, RETURNED
  inspectionDate: Date | null;
  inspectedBy: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GRItem {
  id: string;
  poLineItemId: string;
  productId: string | null;
  productName: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  batchNumber: string | null;
  expiryDate: Date | null;
  location: string | null;      // Warehouse location
  rejectionReason: string | null;
}

enum GRStatus {
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  INSPECTED = 'INSPECTED',
  PARTIAL_ACCEPTED = 'PARTIAL_ACCEPTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED'
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ poId, receivedDate, items[] }` | `Result<GoodsReceipt>` | Records event |
| `reconstitute()` | `GoodsReceiptState` | `GoodsReceipt>` | No events |
| `recordInspection()` | `{ inspectedBy, items[] }` | `Result<void>` | Record inspection results |
| `complete()` | — | `Result<void>` | Finalize, trigger inventory update |
| `reject()` | `reason` | `Result<void>` | Reject entire delivery |

---

#### PurchaseReturn

**File:** `domain/entities/PurchaseReturn.ts`

**State:**
```typescript
interface PurchaseReturnState {
  id: string;
  returnNumber: string;         // Auto-generated: PRN-YYYYMMDD-####
  grId: string;
  grNumber: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  returnDate: Date;
  reason: string;
  returnType: ReturnType;       // DEFECTIVE, WRONG_ITEM, EXCESS, DAMAGED
  items: ReturnItem[];
  totalAmount: number;
  status: ReturnStatus;         // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  creditNoteNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

enum ReturnType {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  EXCESS = 'EXCESS',
  DAMAGED = 'DAMAGED'
}

enum ReturnStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}
```

**Methods:**

| Method | Input | Returns | Notes |
|---|---|---|---|
| `create()` | `{ grId, returnType, reason, items[] }` | `Result<PurchaseReturn>` | Records event |
| `reconstitute()` | `PurchaseReturnState` | `PurchaseReturn>` | No events |
| `submit()` | — | `Result<void>` | Submit for approval |
| `approve()` | `{ approverId, creditNoteNumber }` | `Result<void>` | Approve return |
| `reject()` | `{ rejectorId, reason }` | `Result<void>` | Reject return |
| `complete()` | — | `Result<void>` | Mark as completed |

---

### 3.2 Value Objects

| Value Object | File | Rules |
|---|---|---|
| `PRStatus` | `domain/value-objects/PRStatus.ts` | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED, PROCESSED |
| `POStatus` | `domain/value-objects/POStatus.ts` | DRAFT, PENDING_APPROVAL, APPROVED, SENT, PARTIAL_RECEIPT, RECEIVED, CANCELLED |
| `VendorType` | `domain/value-objects/VendorType.ts` | GOODS, SERVICES, BOTH |
| `RFQStatus` | `domain/value-objects/RFQStatus.ts` | DRAFT, PUBLISHED, CLOSED, CANCELLED |
| `GRStatus` | `domain/value-objects/GRStatus.ts` | PENDING_INSPECTION, INSPECTED, PARTIAL_ACCEPTED, ACCEPTED, REJECTED, RETURNED |
| `ReturnType` | `domain/value-objects/ReturnType.ts` | DEFECTIVE, WRONG_ITEM, EXCESS, DAMAGED |
| `ReturnStatus` | `domain/value-objects/ReturnStatus.ts` | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED |
| `ApprovalLevel` | `domain/value-objects/ApprovalLevel.ts` | Validates approval hierarchy |
| `Money` | `domain/value-objects/Money.ts` | Immutable, decimal precision |

---

### 3.3 Domain Events

| Event | Type | Properties |
|---|---|---|
| `PRCreated` | `purchasing.pr.created` | prId, prNumber, requestorId, departmentId |
| `PRSubmitted` | `purchasing.pr.submitted` | prId, prNumber, currentApprovalLevel |
| `PRApproved` | `purchasing.pr.approved` | prId, prNumber, approverId, approvalLevel |
| `PRRejected` | `purchasing.pr.rejected` | prId, prNumber, rejectorId, reason |
| `PRCancelled` | `purchasing.pr.cancelled` | prId, prNumber, cancellerId, reason |
| `PRProcessed` | `purchasing.pr.processed` | prId, prNumber, poId |
| `POCreated` | `purchasing.po.created` | poId, poNumber, vendorId, prId |
| `POSubmitted` | `purchasing.po.submitted` | poId, poNumber, currentApprovalLevel |
| `POApproved` | `purchasing.po.approved` | poId, poNumber, approverId, totalAmount |
| `PORejected` | `purchasing.po.rejected` | poId, poNumber, rejectorId, reason |
| `POSent` | `purchasing.po.sent` | poId, poNumber, vendorId, sentAt |
| `VendorCreated` | `purchasing.vendor.created` | vendorId, vendorCode, name |
| `VendorUpdated` | `purchasing.vendor.updated` | vendorId, vendorCode |
| `VendorBlocked` | `purchasing.vendor.blocked` | vendorId, reason |
| `GoodsReceiptReceived` | `purchasing.goods-receipt.received` | grId, grNumber, poId, vendorId, items[] |
| `GoodsReceiptCompleted` | `purchasing.goods-receipt.completed` | grId, grNumber, inventoryUpdated |
| `PurchaseReturnCreated` | `purchasing.return.created` | returnId, returnNumber, grId, vendorId |

---

### 3.4 Repository Interfaces

#### IPurchaseRequisitionRepository

```typescript
interface IPurchaseRequisitionRepository {
  findById(id: string): Promise<PurchaseRequisition | null>;
  findByPRNumber(prNumber: string): Promise<PurchaseRequisition | null>;
  findAll(filter: PRFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseRequisition>>;
  findByRequestor(requestorId: string, filter: PRFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseRequisition>>;
  findByDepartment(departmentId: string, filter: PRFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseRequisition>>;
  findPendingApprovals(approverId: string, filter: PRFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseRequisition>>;
  save(pr: PurchaseRequisition): Promise<void>;
  update(pr: PurchaseRequisition): Promise<void>;
  getNextPRNumber(date: Date): Promise<string>;
}
// PRFilter: { status?: PRStatus; requestorId?: string; departmentId?: string; dateFrom?: Date; dateTo?: Date }
```

#### IPurchaseOrderRepository

```typescript
interface IPurchaseOrderRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  findByPONumber(poNumber: string): Promise<PurchaseOrder | null>;
  findAll(filter: POFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseOrder>>;
  findByVendor(vendorId: string, filter: POFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseOrder>>;
  findByPR(prId: string): Promise<PurchaseOrder[]>;
  findPendingApprovals(approverId: string, filter: POFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseOrder>>;
  save(po: PurchaseOrder): Promise<void>;
  update(po: PurchaseOrder): Promise<void>;
  getNextPONumber(date: Date): Promise<string>;
}
// POFilter: { status?: POStatus; vendorId?: string; dateFrom?: Date; dateTo?: Date }
```

#### IVendorRepository

```typescript
interface IVendorRepository {
  findById(id: string): Promise<Vendor | null>;
  findByVendorCode(vendorCode: string): Promise<Vendor | null>;
  findAll(filter: VendorFilter, pagination: PaginationInput): Promise<PaginatedResult<Vendor>>;
  findActive(): Promise<Vendor[]>;
  findActiveVendors(): Promise<Vendor[]>;
  findByType(type: VendorType): Promise<Vendor[]>;
  save(vendor: Vendor): Promise<void>;
  update(vendor: Vendor): Promise<void>;
  getNextVendorCode(): Promise<string>;
  hasActivePOs(vendorId: string): Promise<boolean>;
}
// VendorFilter: { isActive?: boolean; type?: VendorType; search?: string }
```

#### IIRFQRepository

```typescript
interface IIRFQRepository {
  findById(id: string): Promise<RequestForQuotation | null>;
  findByRFQNumber(rfqNumber: string): Promise<RequestForQuotation | null>;
  findAll(filter: RFQFilter, pagination: PaginationInput): Promise<PaginatedResult<RequestForQuotation>>;
  findByStatus(status: RFQStatus): Promise<RequestForQuotation[]>;
  save(rfq: RequestForQuotation): Promise<void>;
  update(rfq: RequestForQuotation): Promise<void>;
  getNextRFQNumber(date: Date): Promise<string>;
}
// RFQFilter: { status?: RFQStatus; dateFrom?: Date; dateTo?: Date }
```

#### IGoodsReceiptRepository

```typescript
interface IGoodsReceiptRepository {
  findById(id: string): Promise<GoodsReceipt | null>;
  findByGRNumber(grNumber: string): Promise<GoodsReceipt | null>;
  findAll(filter: GRFilter, pagination: PaginationInput): Promise<PaginatedResult<GoodsReceipt>>;
  findByPO(poId: string): Promise<GoodsReceipt[]>;
  findByVendor(vendorId: string, filter: GRFilter, pagination: PaginationInput): Promise<PaginatedResult<GoodsReceipt>>;
  save(gr: GoodsReceipt): Promise<void>;
  update(gr: GoodsReceipt): Promise<void>;
  getNextGRNumber(date: Date): Promise<string>;
}
// GRFilter: { status?: GRStatus; dateFrom?: Date; dateTo?: Date; vendorId?: string }
```

#### IPurchaseReturnRepository

```typescript
interface IPurchaseReturnRepository {
  findById(id: string): Promise<PurchaseReturn | null>;
  findByReturnNumber(returnNumber: string): Promise<PurchaseReturn | null>;
  findAll(filter: ReturnFilter, pagination: PaginationInput): Promise<PaginatedResult<PurchaseReturn>>;
  findByGR(grId: string): Promise<PurchaseReturn[]>;
  save(returnItem: PurchaseReturn): Promise<void>;
  update(returnItem: PurchaseReturn): Promise<void>;
  getNextReturnNumber(date: Date): Promise<string>;
}
// ReturnFilter: { status?: ReturnStatus; returnType?: ReturnType; dateFrom?: Date; dateTo?: Date }
```

---

## 4. Application Layer

### 4.1 DTOs & Validation Schemas

| DTO | Fields |
|---|---|
| **CreatePRSchema** | `requestorId` (uuid), `departmentId` (uuid), `requestedDate` (date), `requiredDate` (date), `lineItems[]` (productId?, name, description, quantity, unit, estimatedPrice, vendorId?, reason?), `notes?` |
| **UpdatePRSchema** | `requestedDate?` (date), `requiredDate?` (date), `lineItems?`, `notes?` |
| **ListPRSchema** | `page` (default 1), `limit` (default 20, max 100), `status?`, `requestorId?` (uuid), `departmentId?` (uuid), `dateFrom?`, `dateTo?` |
| **ApproveRejectSchema** | `remarks?` (max 500) |
| **CreatePOSchema** | `prId?` (uuid), `vendorId` (uuid, required), `orderDate` (date), `expectedDeliveryDate` (date), `lineItems[]`, `paymentTermId?`, `paymentTermDays` (default 30), `shippingAddress`, `notes?`, `internalNotes?` |
| **UpdatePOSchema** | `expectedDeliveryDate?` (date), `lineItems?`, `notes?`, `internalNotes?` |
| **ListPOSchema** | `page`, `limit`, `status?`, `vendorId?`, `dateFrom?`, `dateTo?` |
| **CreateVendorSchema** | `name` (1-200), `type` (enum), `taxId?`, `email`, `phone`, `website?`, `billingAddress`, `shippingAddress`, `contactPerson`, `contactPhone`, `contactEmail`, `paymentTermId?`, `defaultPaymentTermDays` (default 30), `bankName?`, `bankAccountNumber?`, `bankAccountName?` |
| **UpdateVendorSchema** | `name?`, `email?`, `phone?`, `addresses?`, `contactInfo?`, `paymentTermId?`, `bankInfo?` |
| **ListVendorSchema** | `page`, `limit`, `isActive?` (boolean), `type?`, `search?` |
| **VendorRatingSchema** | `rating` (1-5), `comments?` |
| **CreateRFQSchema** | `prId?` (uuid), `title` (1-200), `description`, `items[]`, `invitedVendors[]` (uuid[]), `validityDays` (default 7) |
| **ListRFQSchema** | `page`, `limit`, `status?`, `dateFrom?`, `dateTo?` |
| **SubmitQuotationSchema** | `vendorId` (uuid), `items[]`, `validityDays`, `notes?` |
| **CloseRFQSchema** | `winnerQuotationId` (uuid) |
| **CreateGRSchema** | `poId` (uuid), `receivedDate` (date), `items[]` (poLineItemId, receivedQty, batchNumber?, expiryDate?, location?), `notes?` |
| **ListGRSchema** | `page`, `limit`, `status?`, `vendorId?`, `dateFrom?`, `dateTo?` |
| **InspectionSchema** | `inspectedBy` (uuid), `items[]` (itemId, acceptedQty, rejectedQty, rejectionReason?), `notes?` |
| **CreateReturnSchema** | `grId` (uuid), `returnType` (enum), `reason` (required), `items[]` (grItemId, returnedQty, reason?), `notes?` |
| **ListReturnSchema** | `page`, `limit`, `status?`, `returnType?`, `dateFrom?`, `dateTo?` |

---

### 4.2 Use Cases

#### Purchase Requisition

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreatePRUseCase` | CreatePRDTO | PR fields | Generates PR number, publishes events |
| `GetPRUseCase` | `{ id }` | PR fields with history | — |
| `ListPRUseCase` | ListPRDTO | `{ items[], meta }` | — |
| `UpdatePRUseCase` | `{ id, ...updates }` | PR fields | Only DRAFT status |
| `SubmitPRUseCase` | `{ id }` | PR fields | Starts approval workflow |
| `ApprovePRUseCase` | `{ prId, approverId, remarks? }` | PR fields | Advances approval or finalizes |
| `RejectPRUseCase` | `{ prId, rejectorId, reason }` | PR fields | Sets REJECTED status |
| `CancelPRUseCase` | `{ prId, cancellerId, reason }` | PR fields | From PENDING or APPROVED |
| `GetPRHistoryUseCase` | `{ id }` | ApprovalHistory[] | — |

#### Purchase Order

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreatePOUseCase` | CreatePODTO | PO fields | Generates PO number, links PR if provided |
| `CreatePOFromPRUseCase` | `{ prId, vendorId, ... }` | PO fields | Copies items from PR |
| `GetPOUseCase` | `{ id }` | PO fields | — |
| `ListPOUseCase` | ListPODTO | `{ items[], meta }` | — |
| `UpdatePOUseCase` | `{ id, ...updates }` | PO fields | Only DRAFT status |
| `SubmitPOUseCase` | `{ id }` | PO fields | Starts approval workflow |
| `ApprovePOUseCase` | `{ poId, approverId, remarks? }` | PO fields | Advances approval or finalizes |
| `RejectPOUseCase` | `{ poId, rejectorId, reason }` | PO fields | Sets REJECTED status |
| `CancelPOUseCase` | `{ poId, cancellerId, reason }` | PO fields | From PENDING or APPROVED |
| `SendPOUseCase` | `{ poId }` | PO fields | APPROVED → SENT, notifies vendor |
| `GetPOHistoryUseCase` | `{ id }` | ApprovalHistory[] | — |

#### Vendor

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateVendorUseCase` | CreateVendorDTO | Vendor fields | Generates vendor code, checks uniqueness |
| `GetVendorUseCase` | `{ id }` | Vendor fields | — |
| `ListVendorsUseCase` | ListVendorDTO | `{ items[], meta }` | — |
| `UpdateVendorUseCase` | `{ id, ...updates }` | Vendor fields | — |
| `DeleteVendorUseCase` | `{ id }` | — | Checks no active POs |
| `ActivateVendorUseCase` | `{ id }` | Vendor fields | Sets isActive = true |
| `DeactivateVendorUseCase` | `{ id }` | Vendor fields | Sets isActive = false |
| `BlockVendorUseCase` | `{ id, reason }` | Vendor fields | Sets isBlocked = true |
| `GetVendorPerformanceUseCase` | `{ id }` | PerformanceMetrics | Aggregates PO, GR, return data |
| `RateVendorUseCase` | `{ vendorId, rating, comments? }` | Vendor fields | Updates average rating |

#### RFQ

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateRFQUseCase` | CreateRFQDTO | RFQ fields | Generates RFQ number |
| `GetRFQUseCase` | `{ id }` | RFQ fields with quotations | — |
| `ListRFQUseCase` | ListRFQDTO | `{ items[], meta }` | — |
| `PublishRFQUseCase` | `{ rfqId }` | RFQ fields | DRAFT → PUBLISHED, notifies vendors |
| `SubmitQuotationUseCase` | `{ rfqId, ...quotation }` | RFQ fields | Adds vendor quotation |
| `CloseRFQUseCase` | `{ rfqId, winnerQuotationId }` | RFQ fields | Selects winner, closes RFQ |

#### Goods Receipt

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateGRUseCase` | CreateGRDTO | GR fields | Generates GR number, validates PO |
| `GetGRUseCase` | `{ id }` | GR fields | — |
| `ListGRUseCase` | ListGRDTO | `{ items[], meta }` | — |
| `RecordInspectionUseCase` | `{ grId, items[], notes? }` | GR fields | Records inspection results |
| `CompleteGRUseCase` | `{ grId }` | GR fields | Finalizes, publishes inventory event |
| `RejectGRUseCase` | `{ grId, reason }` | GR fields | Rejects entire delivery |

#### Purchase Return

| Use Case | Input | Output | Side Effects |
|---|---|---|---|
| `CreateReturnUseCase` | CreateReturnDTO | Return fields | Generates return number |
| `GetReturnUseCase` | `{ id }` | Return fields | — |
| `ListReturnsUseCase` | ListReturnDTO | `{ items[], meta }` | — |
| `SubmitReturnUseCase` | `{ returnId }` | Return fields | Starts approval |
| `ApproveReturnUseCase` | `{ returnId, approverId, creditNoteNumber }` | Return fields | Approves, generates credit note |
| `RejectReturnUseCase` | `{ returnId, rejectorId, reason }` | Return fields | Rejects return |

---

### 4.3 Tokens (DI)

```typescript
// application/tokens.ts
export const TOKENS = {
  PurchaseRequisitionRepository: Symbol('IPurchaseRequisitionRepository'),
  PurchaseOrderRepository:        Symbol('IPurchaseOrderRepository'),
  VendorRepository:               Symbol('IVendorRepository'),
  RFQRepository:                  Symbol('IIRFQRepository'),
  GoodsReceiptRepository:         Symbol('IGoodsReceiptRepository'),
  PurchaseReturnRepository:       Symbol('IPurchaseReturnRepository'),
  PRNumberGenerator:              Symbol('IPRNumberGenerator'),
  PONumberGenerator:              Symbol('IPONumberGenerator'),
  VendorCodeGenerator:            Symbol('IVendorCodeGenerator'),
  RFQNumberGenerator:             Symbol('IRFQNumberGenerator'),
  GRNumberGenerator:              Symbol('IGRNumberGenerator'),
  ReturnNumberGenerator:          Symbol('IReturnNumberGenerator'),
  ApprovalService:                Symbol('IApprovalService'),
  EventBus:                       Symbol('IEventBus'),
} as const;
```

---

## 5. Infrastructure Layer

### 5.1 Database Schema

All tables are in the `purchasing` schema (PostgreSQL).

**Migration files:** `infrastructure/database/migrations/`

| Table | Migration | Key Columns |
|---|---|---|---|
| `purchasing.vendors` | 001_create_purchasing_schema | vendor_code (UNIQUE), email, type, rating, is_active, is_blocked, deleted_at (soft delete) |
| `purchasing.purchase_requisitions` | 002_create_pr | pr_number (UNIQUE), requestor_id, department_id, requested_date, required_date, total_amount, status, current_approval_level |
| `purchasing.pr_line_items` | 002_create_pr | pr_id (FK), product_id (nullable), description, quantity, unit, estimated_unit_price, estimated_total, vendor_id (nullable) |
| `purchasing.pr_approval_history` | 002_create_pr | pr_id (FK), approver_id, action, remarks, created_at |
| `purchasing.purchase_orders` | 003_create_po | po_number (UNIQUE), pr_id (FK, nullable), vendor_id, order_date, expected_delivery_date, total_amount, status, current_approval_level |
| `purchasing.po_line_items` | 003_create_po | po_id (FK), pr_line_item_id (FK, nullable), product_id (nullable), quantity, unit, unit_price, tax_rate, total, received_qty, rejected_qty |
| `purchasing.po_approval_history` | 003_create_po | po_id (FK), approver_id, action, remarks, created_at |
| `purchasing.rfqs` | 004_create_rfq | rfq_number (UNIQUE), pr_id (FK, nullable), title, status, published_at, closed_at, winner_vendor_id |
| `purchasing.rfq_items` | 004_create_rfq | rfq_id (FK), product_id (nullable), name, description, quantity, unit, technical_specs |
| `purchasing.rfq_quotations` | 004_create_rfq | rfq_id (FK), vendor_id, submitted_at, sub_total, tax_amount, total_amount, validity_days, is_selected |
| `purchasing.rfq_quotation_items` | 004_create_rfq | quotation_id (FK), rfq_item_id (FK), unit_price, total, notes |
| `purchasing.goods_receipts` | 005_create_gr | gr_number (UNIQUE), po_id (FK), vendor_id, received_date, received_by, status, inspection_date, inspected_by |
| `purchasing.gr_items` | 005_create_gr | gr_id (FK), po_line_item_id (FK), product_id (nullable), ordered_qty, received_qty, accepted_qty, rejected_qty, batch_number, expiry_date, location |
| `purchasing.purchase_returns` | 006_create_returns | return_number (UNIQUE), gr_id (FK), po_id (FK), vendor_id, return_date, reason, return_type, total_amount, status, credit_note_number |
| `purchasing.return_items` | 006_create_returns | return_id (FK), gr_item_id (FK), product_id (nullable), returned_qty, reason |

**Indexes:**
- `idx_vendors_code`, `idx_vendors_active`, `idx_vendors_type`
- `idx_pr_number`, `idx_pr_status`, `idx_pr_requestor`, `idx_pr_department`, `idx_pr_date`
- `idx_po_number`, `idx_po_status`, `idx_po_vendor`, `idx_po_date`
- `idx_rfq_number`, `idx_rfq_status`
- `idx_gr_number`, `idx_gr_status`, `idx_gr_po`, `idx_gr_vendor`, `idx_gr_date`
- `idx_returns_number`, `idx_returns_status`, `idx_returns_gr`

**Seeded data (001):**
- Default approval levels (if using configurable approval matrix)
- Default payment terms (if managing in purchasing module)

---

### 5.2 HTTP Layer

| File | Purpose |
|---|---|
| `PurchaseRequisitionController` | create, getById, list, update, submit, approve, reject, cancel, getHistory |
| `PurchaseOrderController` | create, getById, list, update, submit, approve, reject, cancel, send, getHistory |
| `VendorController` | create, getById, list, update, delete, activate, deactivate, block, getPerformance, rate |
| `RFQController` | create, getById, list, publish, submitQuotation, close, getQuotations |
| `GoodsReceiptController` | create, getById, list, recordInspection, complete, reject |
| `PurchaseReturnController` | create, getById, list, submit, approve, reject |
| `PurchasingRoutes` | Route definitions with Swagger annotations |
| `PurchasingErrorMapper` | Error code → HTTP status mapping |

---

## 6. Error Handling

### Error Code Reference

**Purchase Requisition errors:**

| Code | HTTP | Message |
|---|---|---|
| `PR_NOT_FOUND` | 404 | Purchase requisition not found |
| `PR_NUMBER_EXISTS` | 409 | Purchase requisition number already exists |
| `PR_NOT_DRAFT` | 409 | Purchase requisition is not in DRAFT status |
| `PR_ALREADY_SUBMITTED` | 409 | Purchase requisition is already submitted |
| `PR_ALREADY_PROCESSED` | 409 | Purchase requisition is already processed |
| `PR_NO_LINE_ITEMS` | 400 | Purchase requisition must have at least one line item |
| `PR_INVALID_DATE` | 400 | Required date must be after requested date |

**Purchase Order errors:**

| Code | HTTP | Message |
|---|---|---|
| `PO_NOT_FOUND` | 404 | Purchase order not found |
| `PO_NUMBER_EXISTS` | 409 | Purchase order number already exists |
| `PO_NOT_DRAFT` | 409 | Purchase order is not in DRAFT status |
| `PO_ALREADY_SUBMITTED` | 409 | Purchase order is already submitted |
| `PO_ALREADY_SENT` | 409 | Purchase order is already sent to vendor |
| `PO_NO_LINE_ITEMS` | 400 | Purchase order must have at least one line item |
| `PO_INVALID_VENDOR` | 404 | Vendor not found or inactive |
| `PO_INVALID_DATE` | 400 | Expected delivery date must be after order date |
| `PO_PR_NOT_APPROVED` | 409 | Cannot create PO from unapproved PR |

**Vendor errors:**

| Code | HTTP | Message |
|---|---|---|
| `VENDOR_NOT_FOUND` | 404 | Vendor not found |
| `VENDOR_CODE_EXISTS` | 409 | Vendor code already exists |
| `VENDOR_EMAIL_EXISTS` | 409 | Vendor email already exists |
| `VENDOR_HAS_ACTIVE_PO` | 409 | Cannot deactivate vendor with active purchase orders |
| `VENDOR_IS_BLOCKED` | 409 | Vendor is blocked for new purchases |
| `VENDOR_NAME_REQUIRED` | 400 | Vendor name is required |
| `VENDOR_EMAIL_REQUIRED` | 400 | Vendor email is required |

**RFQ errors:**

| Code | HTTP | Message |
|---|---|---|
| `RFQ_NOT_FOUND` | 404 | Request for quotation not found |
| `RFQ_NUMBER_EXISTS` | 409 | Request for quotation number already exists |
| `RFQ_NOT_PUBLISHED` | 409 | Request for quotation is not published |
| `RFQ_ALREADY_CLOSED` | 409 | Request for quotation is already closed |
| `RFQ_NO_QUOTATIONS` | 409 | Cannot close RFQ without quotations |

**Goods Receipt errors:**

| Code | HTTP | Message |
|---|---|---|
| `GR_NOT_FOUND` | 404 | Goods receipt not found |
| `GR_NUMBER_EXISTS` | 409 | Goods receipt number already exists |
| `GR_PO_NOT_SENT` | 409 | Cannot receive goods for unapproved PO |
| `GR_QTY_EXCEEDS_ORDERED` | 400 | Received quantity exceeds ordered quantity |
| `GR_ALREADY_COMPLETED` | 409 | Goods receipt is already completed |
| `GR_NOT_PENDING_INSPECTION` | 409 | Goods receipt is not pending inspection |

**Purchase Return errors:**

| Code | HTTP | Message |
|---|---|---|
| `RETURN_NOT_FOUND` | 404 | Purchase return not found |
| `RETURN_NUMBER_EXISTS` | 409 | Purchase return number already exists |
| `RETURN_GR_NOT_COMPLETED` | 409 | Cannot create return for incomplete goods receipt |
| `RETURN_QTY_EXCEEDS_RECEIVED` | 400 | Return quantity exceeds received quantity |

**Fallback:** Any unmapped error code returns 500.

---

## 7. Module Bootstrap

**File:** `PurchasingModule.ts`

**Config:**
```typescript
interface PurchasingModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}
```

**Register phase** (`register()`): Registers repository instances and services in tsyringe container.

**Bootstrap phase** (`bootstrap()`): Resolves dependencies, instantiates all use cases and controllers, creates routes.

**DI flow:**
```
register():
  KyselyPurchaseRequisitionRepository → TOKENS.PurchaseRequisitionRepository
  KyselyPurchaseOrderRepository       → TOKENS.PurchaseOrderRepository
  KyselyVendorRepository              → TOKENS.VendorRepository
  KyselyRFQRepository                 → TOKENS.RFQRepository
  KyselyGoodsReceiptRepository        → TOKENS.GoodsReceiptRepository
  KyselyPurchaseReturnRepository      → TOKENS.PurchaseReturnRepository
  DatabasePRNumberGenerator           → TOKENS.PRNumberGenerator
  DatabasePONumberGenerator           → TOKENS.PONumberGenerator
  SequentialVendorCodeGenerator       → TOKENS.VendorCodeGenerator
  DatabaseRFQNumberGenerator          → TOKENS.RFQNumberGenerator
  DatabaseGRNumberGenerator           → TOKENS.GRNumberGenerator
  DatabaseReturnNumberGenerator       → TOKENS.ReturnNumberGenerator
  ApprovalService                     → TOKENS.ApprovalService
  eventBus                            → TOKENS.EventBus

bootstrap():
  Resolve all repos + services from container
  Instantiate use cases
  Instantiate controllers
  createPurchasingRoutes(pr, po, vendor, rfq, gr, returns, auth, rbac)
```

---

## 8. Testing

**Target test coverage:**
- Domain: 100% (entities, value objects)
- Application: 100% (use cases)
- Infrastructure: 80%+ (repositories, controllers)

**Test files location:**
- `domain/entities/__tests__/` — Entity unit tests
- `domain/value-objects/__tests__/` — Value object tests
- `application/use-cases/*/__tests__/` — Use case tests with mock repos
- `tests/mocks/` — Mock implementations
- `tests/integration/` — Integration tests
- `tests/e2e/` — E2E tests for HTTP endpoints

**Pattern:** All mocks use in-memory Maps. Tests use `Result.isSuccess()/isFailure()` + `getValue()/getError()`.

---

## 9. Integration Points

### With Inventory Module

**Events Published to Inventory:**
- `purchasing.goods-receipt.completed` → Triggers stock update
- Product master data synchronization

**Events Subscribed from Inventory:**
- `inventory.product.created` → Add to purchasable items catalog
- `inventory.product.updated` → Update product info in PO/PR
- `inventory.stock.low` → Trigger auto-PR creation (optional)

### With Finance Module

**Events Published to Finance:**
- `purchasing.po.approved` → Budget commitment/encumbrance
- `purchasing.goods-receipt.completed` → Accrue accounts payable
- `purchasing.vendor.created` → Vendor master data sync

**Events Subscribed from Finance:**
- `finance.budget.approved` → Enable budget validation
- `finance.payment.made` → Update PO payment status

### With HR Module

**Events Subscribed from HR:**
- `hr.employee.created` → Add as potential requestor
- `hr.employee.updated` → Update requestor info
- `hr.department.changed` → Update department info in open PRs

### Approval Matrix Integration

The purchasing module can integrate with a centralized approval workflow system:

```typescript
interface ApprovalMatrix {
  departmentId: string;
  amountRanges: {
    min: number;
    max: number;
    approvalLevels: string[]; // approver IDs or role IDs
  }[];
}
```

**Example:**
- Amount < 1M: 1 approval (Department Head)
- Amount 1M-10M: 2 approvals (Dept Head + Finance)
- Amount > 10M: 3 approvals (Dept Head + Finance + Director)

---

## 10. Future Enhancements (TODO)

### Advanced Features

### Contract Management
- Vendor contract lifecycle management
- Contract renewal alerts
- Contract-based pricing
- Volume discount agreements
- Blanket POs and release orders

### Budget Integration
- Real-time budget checking
- Budget reservation on PO approval
- Budget consumption reports
- Cost center allocation
- Multi-year budget support

### Advanced Sourcing
- Vendor portal for self-service
- Automated RFQ distribution
- Bid comparison and analysis
- Vendor scoring/ranking system
- Supplier performance management (SPM)
- Supplier risk assessment

### Inventory Integration
- Drop-ship orders (direct to customer)
- Consignment stock management
- Vendor-managed inventory (VMI)
- Just-in-time (JIT) purchasing
- Material requirements planning (MRP) integration

### Analytics & Reporting
- Purchase price variance analysis
- Spend analysis by category/vendor
- Delivery performance metrics
- Quality rejection analysis
- Vendor scorecards
- Savings tracking
- Budget utilization reports

### Automation
- Auto-PR from inventory min stock levels
- Auto-PO from approved PR (configurable)
- Three-way match automation (PO-GR-Invoice)
- Payment scheduling automation
- Email/SMS notifications for approvals

### Compliance
- Tax compliance (PPN, PPh)
- Procurement policy enforcement
- Audit trail for all changes
- Document attachment (quotations, invoices)
- Regulatory compliance reporting

### Multi-Entity & Multi-Currency
- Inter-company purchases
- Multi-currency POs with exchange rate management
- Cross-border procurement
- Import duty and tax calculation

### Quality Management
- Inspection checklist templates
- Quality hold management
- Non-conformance reports (NCR)
- Corrective action requests (CAR)
- Vendor quality ratings

---

## Changelog

### 2026-05-07 - Initial Documentation

**Completed:**
- ✅ Created comprehensive documentation structure
- ✅ Defined all entities and value objects
- ✅ Specified all API endpoints
- ✅ Documented repository interfaces
- ✅ Outlined use cases
- ✅ Error code definitions
- ✅ Integration points with other modules
