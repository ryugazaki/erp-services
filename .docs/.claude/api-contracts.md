# API Contract & Endpoint Design — ERP Modular System

---

## 1. REST API Principles

Every endpoint in this system follows these rules without exception:

- **Resource-oriented URLs** — nouns, not verbs. `/users` not `/getUsers`
- **HTTP methods carry intent** — GET reads, POST creates, PUT replaces, PATCH updates partially, DELETE removes
- **Stateless** — no server-side session; every request carries all context it needs via JWT
- **Consistent response envelope** — every response, success or failure, follows the same shape
- **Plural resource names** — `/employees`, `/products`, `/invoices`
- **Lowercase kebab-case for multi-word resources** — `/purchase-orders`, `/cost-centers`

---

## 2. API Versioning

### Strategy: URI Path Versioning

```
https://api.erp.company.com/v1/auth/login
https://api.erp.company.com/v1/hr/employees
https://api.erp.company.com/v2/hr/employees    ← breaking change → new version
```

Version lives in the URL path, not in headers or query strings. This makes it explicit,
bookmarkable, and easy to route at the gateway level.

### Versioning Rules

| Requires new version | Does NOT require new version |
|---|---|
| Removing a field from response | Adding a new optional field |
| Changing a field's data type | Adding a new endpoint |
| Changing HTTP method of existing endpoint | Adding a new optional query param |
| Changing resource name/URL | Bug fixes that don't change contract |
| Removing an endpoint | Deprecation notices (add `Deprecation` header) |

### Gateway Routing by Version

```
/v1/* → routed to stable module handlers
/v2/* → routed to updated module handlers (run in parallel during migration)
```

Both versions run simultaneously during a transition period. A `Deprecation` header
is added to v1 responses to signal migration deadline to API consumers.

---

## 3. URL Structure per Module

All routes follow this pattern:

```
/v{version}/{module}/{resource}/{id?}/{sub-resource?}
```

### Auth Module
```
POST   /v1/auth/login
POST   /v1/auth/logout
POST   /v1/auth/refresh
POST   /v1/auth/forgot-password
POST   /v1/auth/reset-password
GET    /v1/auth/me
PATCH  /v1/auth/me/password
```

### HR Module
```
GET    /v1/hr/employees
POST   /v1/hr/employees
GET    /v1/hr/employees/:id
PATCH  /v1/hr/employees/:id
DELETE /v1/hr/employees/:id

GET    /v1/hr/employees/:id/contracts
POST   /v1/hr/employees/:id/contracts

GET    /v1/hr/departments
POST   /v1/hr/departments
GET    /v1/hr/departments/:id
PATCH  /v1/hr/departments/:id
DELETE /v1/hr/departments/:id

GET    /v1/hr/positions
POST   /v1/hr/positions
GET    /v1/hr/positions/:id
PATCH  /v1/hr/positions/:id
```

### Inventory Module
```
GET    /v1/inventory/products
POST   /v1/inventory/products
GET    /v1/inventory/products/:id
PATCH  /v1/inventory/products/:id
DELETE /v1/inventory/products/:id

GET    /v1/inventory/products/:id/stock
POST   /v1/inventory/stock/adjustments
GET    /v1/inventory/stock/movements

GET    /v1/inventory/categories
POST   /v1/inventory/categories
GET    /v1/inventory/categories/:id
PATCH  /v1/inventory/categories/:id
DELETE /v1/inventory/categories/:id

GET    /v1/inventory/warehouses
POST   /v1/inventory/warehouses
GET    /v1/inventory/warehouses/:id
```

### GA Module (General Affair)
```
GET    /v1/ga/assets
POST   /v1/ga/assets
GET    /v1/ga/assets/:id
PATCH  /v1/ga/assets/:id
DELETE /v1/ga/assets/:id

GET    /v1/ga/assets/:id/maintenance-logs
POST   /v1/ga/assets/:id/maintenance-logs

GET    /v1/ga/maintenance-schedules
POST   /v1/ga/maintenance-schedules
PATCH  /v1/ga/maintenance-schedules/:id

GET    /v1/ga/procurement-requests
POST   /v1/ga/procurement-requests
GET    /v1/ga/procurement-requests/:id
PATCH  /v1/ga/procurement-requests/:id/status
```

### Finance Module
```
GET    /v1/finance/accounts
POST   /v1/finance/accounts
GET    /v1/finance/accounts/:id
PATCH  /v1/finance/accounts/:id

GET    /v1/finance/journal-entries
POST   /v1/finance/journal-entries
GET    /v1/finance/journal-entries/:id

GET    /v1/finance/invoices
POST   /v1/finance/invoices
GET    /v1/finance/invoices/:id
PATCH  /v1/finance/invoices/:id/status

GET    /v1/finance/reports/balance-sheet
GET    /v1/finance/reports/income-statement
GET    /v1/finance/reports/cash-flow
```

---

## 4. Authentication — JWT Strategy

### Token Architecture

The system uses a **dual-token strategy**: short-lived access token + long-lived refresh token.

```
┌─────────────────────────────────────────────────────────────┐
│                        TOKEN PAIR                           │
│                                                             │
│  Access Token                  Refresh Token                │
│  ─────────────                 ─────────────                │
│  TTL: 15 minutes               TTL: 7 days                  │
│  Stored: memory (client)       Stored: httpOnly cookie      │
│  Sent via: Authorization       Sent via: cookie             │
│            header                                           │
│  Contains: userId, role,       Contains: tokenId only       │
│            permissions,        (opaque reference to DB)     │
│            moduleAccess                                     │
└─────────────────────────────────────────────────────────────┘
```

### Access Token Payload

```typescript
interface AccessTokenPayload {
  sub: string;              // userId
  email: string;
  role: string;             // SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE | GUEST
  permissions: string[];    // ["hr:employees:read", "hr:employees:write", ...]
  moduleAccess: string[];   // ["auth", "hr", "inventory"]  ← modules enabled for this user
  iat: number;              // issued at
  exp: number;              // expiry
}
```

### Login Flow

```
Client                      Gateway                    Auth Module
  │                            │                            │
  │── POST /v1/auth/login ────>│                            │
  │   { email, password }      │── forward ────────────────>│
  │                            │                    validate credentials
  │                            │                    generate token pair
  │                            │<── { accessToken, ─────────│
  │                            │     refreshToken }         │
  │<── 200 OK ─────────────────│                            │
  │    body: { accessToken }   │
  │    cookie: refreshToken    │
  │    (httpOnly, secure)      │
```

### Request Authentication Flow

```
Client                      Gateway                    Module
  │                            │                          │
  │── GET /v1/hr/employees ───>│                          │
  │   Authorization:           │                          │
  │   Bearer <accessToken>     │                          │
  │                            │ verify JWT signature     │
  │                            │ check expiry             │
  │                            │ extract payload          │
  │                            │── attach user context ──>│
  │                            │   req.user = payload     │ apply RBAC
  │<───────────────────────────│<─────────────────────────│
```

### Token Refresh Flow

```
Client                      Gateway                    Auth Module
  │                            │                            │
  │ (access token expired)     │                            │
  │── POST /v1/auth/refresh ──>│                            │
  │   cookie: refreshToken     │── forward ────────────────>│
  │                            │              validate refresh token in DB
  │                            │              rotate: invalidate old, issue new
  │<── 200 OK ─────────────────│<── new token pair ─────────│
  │    body: { accessToken }   │
  │    cookie: new refreshToken│
```

**Refresh token rotation** is mandatory. Every refresh invalidates the old token and issues
a new one. If an already-used refresh token is detected, the entire token family is revoked
(stolen token protection).

---

## 5. Authorization — RBAC with Module Permissions

### Role Hierarchy

```
SUPER_ADMIN
  └── Full access to all modules, all actions. System-level operations.

ADMIN
  └── Full access to assigned modules. Cannot manage other admins.

MANAGER
  └── Read + write access within their department/module scope.
      Can approve requests within their authority level.

EMPLOYEE
  └── Read access to relevant resources. Write access only to own data.

GUEST
  └── Read-only access to explicitly granted resources.
```

### Permission Naming Convention

```
Format: <module>:<resource>:<action>

Examples:
  hr:employees:read
  hr:employees:write
  hr:employees:delete
  hr:departments:read
  hr:departments:write
  inventory:products:read
  inventory:products:write
  inventory:stock:adjust
  finance:invoices:read
  finance:invoices:write
  finance:reports:read
  finance:journal-entries:write
  ga:assets:read
  ga:assets:write
  ga:procurement-requests:approve
```

### Permission Matrix per Role

| Permission | SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE | GUEST |
|---|:---:|:---:|:---:|:---:|:---:|
| `hr:employees:read` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `hr:employees:write` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `hr:employees:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `inventory:products:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `inventory:products:write` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `inventory:stock:adjust` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:reports:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:journal-entries:write` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `ga:procurement-requests:approve` | ✅ | ✅ | ✅ | ❌ | ❌ |

### Module Access Control

Beyond individual permissions, entire modules can be toggled per user or per tenant.
This is what drives the "pluggable" behaviour from the client's perspective.

```typescript
// A user's moduleAccess controls which module routes they can even reach
{
  "sub": "usr_abc123",
  "role": "MANAGER",
  "moduleAccess": ["hr", "inventory"],   // This user cannot touch finance or ga
  "permissions": [
    "hr:employees:read",
    "hr:employees:write",
    "hr:departments:read",
    "inventory:products:read",
    "inventory:stock:adjust"
  ]
}
```

### RBAC Middleware Implementation

```typescript
// libs/core/http/src/middlewares/rbac.middleware.ts

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AccessTokenPayload;

    // Check module access first (coarse-grained)
    const moduleRequired = extractModule(req.path);  // /v1/hr/... → "hr"
    if (!user.moduleAccess.includes(moduleRequired)) {
      return res.status(403).json(
        ApiResponse.error('MODULE_ACCESS_DENIED', 'You do not have access to this module', 403)
      );
    }

    // Check specific permission (fine-grained)
    const hasPermission = permissions.every(p => user.permissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json(
        ApiResponse.error('INSUFFICIENT_PERMISSIONS', 'You do not have the required permissions', 403)
      );
    }

    next();
  };
};
```

```typescript
// Usage in route definition
router.get(
  '/employees',
  requirePermission('hr:employees:read'),
  employeeController.list
);

router.delete(
  '/employees/:id',
  requirePermission('hr:employees:delete'),
  employeeController.delete
);

router.post(
  '/procurement-requests/:id/approve',
  requirePermission('ga:procurement-requests:approve'),
  procurementController.approve
);
```

---

## 6. Standard Response Format

Every single response from every endpoint uses this envelope. No exceptions.

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: ResponseMeta;       // only present on paginated responses
  timestamp: string;         // ISO 8601
  requestId: string;         // for tracing / debugging
}
```

```json
// Single resource — GET /v1/hr/employees/:id
{
  "success": true,
  "statusCode": 200,
  "message": "Employee retrieved successfully",
  "data": {
    "id": "emp_01HXYZ",
    "fullName": "Budi Santoso",
    "email": "budi.santoso@company.com",
    "department": "Engineering",
    "position": "Backend Developer",
    "joinDate": "2023-03-15",
    "status": "ACTIVE"
  },
  "timestamp": "2025-05-02T08:30:00.000Z",
  "requestId": "req_01JABCDE"
}
```

```json
// Created resource — POST /v1/hr/employees → 201
{
  "success": true,
  "statusCode": 201,
  "message": "Employee created successfully",
  "data": {
    "id": "emp_01HXYZ",
    "fullName": "Rina Wijaya",
    "email": "rina.wijaya@company.com",
    "department": "Finance",
    "position": "Accountant",
    "joinDate": "2025-05-02",
    "status": "ACTIVE"
  },
  "timestamp": "2025-05-02T08:31:00.000Z",
  "requestId": "req_01JABCDF"
}
```

```json
// Action with no body — DELETE /v1/hr/employees/:id → 200
{
  "success": true,
  "statusCode": 200,
  "message": "Employee deleted successfully",
  "data": null,
  "timestamp": "2025-05-02T08:32:00.000Z",
  "requestId": "req_01JABCDG"
}
```

### Paginated List Response

```typescript
interface ResponseMeta {
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

```json
// GET /v1/hr/employees?page=1&limit=10&department=Engineering
{
  "success": true,
  "statusCode": 200,
  "message": "Employees retrieved successfully",
  "data": [
    {
      "id": "emp_01HXYZ",
      "fullName": "Budi Santoso",
      "email": "budi.santoso@company.com",
      "department": "Engineering",
      "position": "Backend Developer",
      "status": "ACTIVE"
    },
    {
      "id": "emp_01HABC",
      "fullName": "Dewi Kusuma",
      "email": "dewi.kusuma@company.com",
      "department": "Engineering",
      "position": "Frontend Developer",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 47,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-05-02T08:33:00.000Z",
  "requestId": "req_01JABCDH"
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;             // machine-readable, SCREAMING_SNAKE_CASE
    message: string;          // human-readable
    details?: FieldError[];   // only present on validation errors
  };
  timestamp: string;
  requestId: string;
}

interface FieldError {
  field: string;
  message: string;
}
```

```json
// 400 — Validation error
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email",    "message": "Invalid email format" },
      { "field": "joinDate", "message": "joinDate must be a valid ISO date" }
    ]
  },
  "timestamp": "2025-05-02T08:34:00.000Z",
  "requestId": "req_01JABCDI"
}
```

```json
// 401 — Unauthenticated
{
  "success": false,
  "statusCode": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token is missing or invalid"
  },
  "timestamp": "2025-05-02T08:35:00.000Z",
  "requestId": "req_01JABCDJ"
}
```

```json
// 403 — Authenticated but not authorized
{
  "success": false,
  "statusCode": 403,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You do not have the required permissions"
  },
  "timestamp": "2025-05-02T08:36:00.000Z",
  "requestId": "req_01JABCDK"
}
```

```json
// 404 — Resource not found
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "Employee with id 'emp_01HXYZ' not found"
  },
  "timestamp": "2025-05-02T08:37:00.000Z",
  "requestId": "req_01JABCDL"
}
```

```json
// 409 — Conflict
{
  "success": false,
  "statusCode": 409,
  "error": {
    "code": "CONFLICT",
    "message": "An employee with this email already exists"
  },
  "timestamp": "2025-05-02T08:38:00.000Z",
  "requestId": "req_01JABCDM"
}
```

```json
// 500 — Internal server error
{
  "success": false,
  "statusCode": 500,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
    // NOTE: never expose stack traces or internal details in production
  },
  "timestamp": "2025-05-02T08:39:00.000Z",
  "requestId": "req_01JABCDN"
}
```

### `ApiResponse` Helper Class

```typescript
// libs/core/http/src/ApiResponse.ts

export class ApiResponse {

  static success<T>(data: T, message: string, statusCode = 200): SuccessResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }

  static paginated<T>(
    data: T[],
    message: string,
    pagination: PaginationMeta,
  ): SuccessResponse<T[]> {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      meta: { pagination },
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }

  static error(code: string, message: string, statusCode: number, details?: FieldError[]): ErrorResponse {
    return {
      success: false,
      statusCode,
      error: { code, message, ...(details && { details }) },
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }
}
```

```typescript
// Usage in controller
export class EmployeeController {
  async list(req: Request, res: Response) {
    const result = await this.listEmployeesUseCase.execute(req.query);

    if (result.isFailure()) {
      return res.status(400).json(
        ApiResponse.error('BAD_REQUEST', result.getError(), 400)
      );
    }

    const { employees, pagination } = result.getValue();
    return res.status(200).json(
      ApiResponse.paginated(employees, 'Employees retrieved successfully', pagination)
    );
  }

  async findById(req: Request, res: Response) {
    const result = await this.findEmployeeUseCase.execute(req.params.id);

    if (result.isFailure()) {
      const isNotFound = result.getError() === 'EMPLOYEE_NOT_FOUND';
      return res.status(isNotFound ? 404 : 400).json(
        ApiResponse.error(result.getError(), 'Employee not found', 404)
      );
    }

    return res.status(200).json(
      ApiResponse.success(result.getValue(), 'Employee retrieved successfully')
    );
  }
}
```

---

## 7. Query Parameters — Standard Conventions

All list endpoints support the following query parameters consistently.

```
Pagination:
  ?page=1               default: 1
  ?limit=10             default: 10, max: 100

Sorting:
  ?sortBy=createdAt     field name to sort by
  ?sortOrder=desc       asc | desc, default: desc

Filtering:
  ?status=ACTIVE        filter by exact value
  ?department=Engineering
  ?createdFrom=2025-01-01    ISO date range start
  ?createdTo=2025-03-31      ISO date range end

Search:
  ?search=budi          full-text search across searchable fields

Field selection (sparse fieldsets):
  ?fields=id,fullName,email    return only specified fields
```

Example combined:
```
GET /v1/hr/employees?page=2&limit=20&department=Engineering&status=ACTIVE&sortBy=fullName&sortOrder=asc&search=budi
```

---

## 8. HTTP Status Code Reference

| Code | When to use |
|---|---|
| `200 OK` | Successful GET, PATCH, DELETE |
| `201 Created` | Successful POST that creates a resource |
| `204 No Content` | Successful DELETE with no response body (alternative to 200) |
| `400 Bad Request` | Validation failure, malformed request body |
| `401 Unauthorized` | Missing, expired, or invalid access token |
| `403 Forbidden` | Authenticated but lacks permission or module access |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource, concurrent update conflict |
| `422 Unprocessable Entity` | Semantically invalid — passes validation but breaks business rule |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled exception — never expose internals |

---

## 9. Request Headers

### Required on every authenticated request
```
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

### Optional but recommended
```
X-Request-ID: <client-generated-uuid>    ← if omitted, gateway generates one
X-Tenant-ID: <tenantId>                  ← for multi-tenant deployments
Accept-Language: id-ID                   ← for localized error messages
```

### Response headers always present
```
X-Request-ID: req_01JABCDE              ← echo back for tracing
X-Response-Time: 42ms
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1746172800
```

---

## 10. Rate Limiting

| Endpoint group | Limit |
|---|---|
| `POST /v1/auth/login` | 10 requests / minute per IP |
| `POST /v1/auth/refresh` | 30 requests / minute per user |
| `POST /v1/auth/forgot-password` | 5 requests / minute per IP |
| All other authenticated endpoints | 1000 requests / minute per user |
| All other unauthenticated endpoints | 60 requests / minute per IP |

When exceeded, the API returns:

```json
{
  "success": false,
  "statusCode": 429,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds."
  },
  "timestamp": "2025-05-02T08:40:00.000Z",
  "requestId": "req_01JABCDO"
}
```

---

## 11. API Security Checklist

| Concern | Implementation |
|---|---|
| Credential exposure | Passwords never returned in any response, even partially |
| Token storage | Access token in memory only; refresh token in `httpOnly`, `Secure`, `SameSite=Strict` cookie |
| Token rotation | Refresh token rotated on every use; entire family revoked on reuse detection |
| Sensitive fields | Fields like `salary`, `bankAccount` require additional explicit permission flag |
| Error messages | Production errors never expose stack traces, query details, or internal paths |
| Input validation | All request bodies validated with schema before reaching use case layer |
| CORS | Whitelist of allowed origins enforced at gateway level |
| HTTPS | All traffic TLS-only; HTTP requests redirected to HTTPS |

---

## Summary

```
Every request:
  1. Hits gateway → JWT verified → user context attached
  2. Module access checked (coarse-grained)
  3. Permission checked (fine-grained)
  4. Use case executed → Result<T> returned
  5. Controller maps Result to ApiResponse
  6. Response sent in standard envelope

Every response:
  ✅ success flag
  ✅ statusCode
  ✅ message (human-readable)
  ✅ data (or null)
  ✅ meta (pagination, if applicable)
  ✅ timestamp (ISO 8601)
  ✅ requestId (for tracing)
```