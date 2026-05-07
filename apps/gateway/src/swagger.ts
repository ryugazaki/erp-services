import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ERP Services API',
      version: '1.0.0',
      description: 'ERP backend API documentation',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string' },
            data: {},
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ERROR_CODE' },
                message: { type: 'string', example: 'Error description' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'MyP@ssw0rd!' },
          },
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            allDevices: { type: 'boolean', example: false },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            sub: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', example: 'EMPLOYEE' },
            permissions: { type: 'array', items: { type: 'string' } },
            moduleAccess: { type: 'array', items: { type: 'string' } },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        // HR Module schemas
        CreateEmployeeRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'hireDate'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john.doe@erp.com' },
            phone: { type: 'string', example: '+62812345678' },
            departmentId: { type: 'string', format: 'uuid' },
            position: { type: 'string', example: 'Software Engineer' },
            hireDate: { type: 'string', format: 'date', example: '2026-01-15' },
          },
        },
        UpdateEmployeeRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            departmentId: { type: 'string', format: 'uuid' },
            position: { type: 'string' },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeNumber: { type: 'string', example: 'EMP-00001' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john.doe@erp.com' },
            phone: { type: 'string', example: '+62812345678' },
            position: { type: 'string' },
            departmentId: { type: 'string', format: 'uuid' },
            hireDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'RESIGNED'], example: 'ACTIVE' },
            userId: { type: 'string', format: 'uuid' },
            temporaryPassword: { type: 'string', description: 'Auto-generated login password (only on creation)' },
          },
        },
        ApplyLeaveRequest: {
          type: 'object',
          required: ['leaveTypeId', 'startDate', 'endDate', 'reason'],
          properties: {
            employeeId: { type: 'string', format: 'uuid', description: 'Required if not linked to authenticated user' },
            leaveTypeId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date', example: '2026-06-01' },
            endDate: { type: 'string', format: 'date', example: '2026-06-03' },
            reason: { type: 'string', minLength: 1, maxLength: 500, example: 'Family vacation' },
          },
        },
        ReviewLeaveRequest: {
          type: 'object',
          properties: {
            remarks: { type: 'string', example: 'Approved by manager' },
          },
        },
        Leave: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            leaveTypeId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            totalDays: { type: 'integer', example: 3 },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
            approvedBy: { type: 'string', format: 'uuid' },
            approvedAt: { type: 'string', format: 'date-time' },
            remarks: { type: 'string' },
            cancelledAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateLeaveTypeRequest: {
          type: 'object',
          required: ['name', 'code', 'defaultDays', 'isPaid'],
          properties: {
            name: { type: 'string', example: 'Annual Leave' },
            code: { type: 'string', example: 'ANNUAL' },
            description: { type: 'string', example: 'Annual paid leave' },
            defaultDays: { type: 'integer', example: 12 },
            isPaid: { type: 'boolean', example: true },
          },
        },
        LeaveType: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Annual Leave' },
            code: { type: 'string', example: 'ANNUAL' },
            description: { type: 'string' },
            defaultDays: { type: 'integer', example: 12 },
            isPaid: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
          },
        },
        LeaveBalance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            leaveTypeId: { type: 'string', format: 'uuid' },
            year: { type: 'integer', example: 2026 },
            totalDays: { type: 'number', example: 12 },
            usedDays: { type: 'number', example: 3 },
            remainingDays: { type: 'number', example: 9 },
          },
        },
        CreateDepartmentRequest: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', example: 'Engineering' },
            code: { type: 'string', example: 'ENG' },
            description: { type: 'string', example: 'Engineering department' },
            headId: { type: 'string', format: 'uuid', description: 'Employee ID of department head' },
          },
        },
        UpdateDepartmentRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            headId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Engineering' },
            code: { type: 'string', example: 'ENG' },
            description: { type: 'string' },
            headId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Inventory Module schemas
        CreateProductRequest: {
          type: 'object',
          required: ['sku', 'name', 'unitOfMeasure'],
          properties: {
            sku: { type: 'string', example: 'LAPTOP-001', description: 'Unique stock keeping unit' },
            name: { type: 'string', example: 'Dell Latitude 5420' },
            description: { type: 'string', example: '14 inch business laptop' },
            categoryId: { type: 'string', format: 'uuid', description: 'Product category ID' },
            unitOfMeasure: {
              type: 'string',
              enum: ['PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK'],
              example: 'PCS'
            },
            basePrice: { type: 'number', example: 15000000, description: 'Base price in IDR' },
            minimumStock: { type: 'integer', example: 10, description: 'Minimum stock level before alert' },
          },
        },
        UpdateProductRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            basePrice: { type: 'number' },
            minimumStock: { type: 'integer' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string', example: 'LAPTOP-001' },
            name: { type: 'string', example: 'Dell Latitude 5420' },
            description: { type: 'string', nullable: true },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            unitOfMeasure: { type: 'string', enum: ['PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK'] },
            basePrice: { type: 'number', example: 15000000 },
            minimumStock: { type: 'integer', example: 10 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', example: 'Electronics' },
            code: { type: 'string', example: 'ELEC' },
            description: { type: 'string', example: 'Electronic products and accessories' },
            parentId: { type: 'string', format: 'uuid', description: 'Parent category ID for hierarchical structure' },
          },
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            parentId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Electronics' },
            code: { type: 'string', example: 'ELEC' },
            description: { type: 'string', nullable: true },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateWarehouseRequest: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string', example: 'Main Warehouse' },
            code: { type: 'string', example: 'WH-001' },
            address: { type: 'string', example: 'Jl. Industrial Raya No. 123, Jakarta' },
            locationId: { type: 'string', example: 'LOC-001', description: 'Location identifier' },
          },
        },
        UpdateWarehouseRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { type: 'string', nullable: true },
            locationId: { type: 'string', nullable: true },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Main Warehouse' },
            code: { type: 'string', example: 'WH-001' },
            address: { type: 'string', nullable: true },
            locationId: { type: 'string', nullable: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateStockMovementRequest: {
          type: 'object',
          required: ['productId', 'warehouseId', 'movementType', 'quantity'],
          properties: {
            productId: { type: 'string', format: 'uuid', description: 'Product ID' },
            warehouseId: { type: 'string', format: 'uuid', description: 'Warehouse ID' },
            movementType: {
              type: 'string',
              enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'],
              description: 'IN: stock in, OUT: stock out, TRANSFER: transfer between warehouses, ADJUSTMENT: manual adjustment'
            },
            quantity: { type: 'integer', minimum: 1, example: 100 },
            referenceType: { type: 'string', example: 'PURCHASE_ORDER', description: 'Reference document type' },
            referenceId: { type: 'string', example: 'PO-001', description: 'Reference document ID' },
            notes: { type: 'string', example: 'Initial stock from supplier' },
            occurredAt: { type: 'string', format: 'date-time', description: 'When the movement occurred (defaults to now)' },
          },
        },
        StockMovement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            movementType: { type: 'string', enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] },
            quantity: { type: 'integer', example: 100 },
            referenceType: { type: 'string', nullable: true },
            referenceId: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            occurredAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Finance Module schemas
        CreateAccountRequest: {
          type: 'object',
          required: ['code', 'name', 'type'],
          properties: {
            code: { type: 'string', pattern: '^[0-9]+(-[0-9]+)+$', example: '1-1001', description: 'Hierarchical code (e.g., "1-1001")' },
            name: { type: 'string', minLength: 1, maxLength: 100, example: 'Cash' },
            description: { type: 'string', maxLength: 500, example: 'Primary cash account' },
            type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], example: 'ASSET' },
            parentId: { type: 'string', format: 'uuid', description: 'Parent account ID for hierarchical accounts' },
          },
        },
        UpdateAccountRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100, example: 'Petty Cash' },
            description: { type: 'string', maxLength: 500, example: 'Updated description' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'acc_1234567890abcdef' },
            code: { type: 'string', description: 'Hierarchical account code (e.g., "1-1001")', example: '1-1001' },
            name: { type: 'string', example: 'Cash' },
            description: { type: 'string', nullable: true, example: 'Primary cash account' },
            type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], example: 'ASSET' },
            parentId: { type: 'string', format: 'uuid', nullable: true, example: 'acc_0987654321fedcba' },
            isActive: { type: 'boolean', example: true },
            isSystemAccount: { type: 'boolean', description: 'System accounts cannot be deleted', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T08:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T08:30:00.000Z' },
          },
        },
        CreateJournalEntryRequest: {
          type: 'object',
          required: ['date', 'description', 'lineItems'],
          properties: {
            date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            description: { type: 'string', minLength: 1, maxLength: 500, example: 'Monthly rent payment' },
            lineItems: {
              type: 'array',
              minItems: 2,
              items: { $ref: '#/components/schemas/JournalLineItemInput' },
            },
          },
        },
        JournalLineItemInput: {
          type: 'object',
          required: ['accountId', 'debitAmount', 'creditAmount'],
          properties: {
            accountId: { type: 'string', format: 'uuid', example: 'acc_1234567890abcdef' },
            description: { type: 'string', maxLength: 500, example: 'Rent expense' },
            debitAmount: { type: 'number', format: 'float', minimum: 0, example: 5000 },
            creditAmount: { type: 'number', format: 'float', minimum: 0, example: 0 },
          },
        },
        UpdateJournalEntryRequest: {
          type: 'object',
          required: ['description'],
          properties: {
            description: { type: 'string', minLength: 1, maxLength: 500, example: 'Updated description' },
          },
        },
        JournalEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'je_1234567890abcdef' },
            entryNumber: { type: 'string', description: 'Auto-generated sequential number', example: 'JE-000001' },
            date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            description: { type: 'string', example: 'Monthly rent payment for January 2024' },
            lineItems: { type: 'array', items: { $ref: '#/components/schemas/JournalLineItem' } },
            status: { type: 'string', enum: ['DRAFT', 'POSTED', 'REVERSED'], example: 'POSTED' },
            postedAt: { type: 'string', format: 'date-time', nullable: true, example: '2024-01-15T10:00:00.000Z' },
            postedBy: { type: 'string', nullable: true, example: 'user_1234567890' },
            reversalEntryId: { type: 'string', format: 'uuid', nullable: true, example: 'je_0987654321fedcba' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        JournalLineItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'li_1234567890abcdef' },
            accountId: { type: 'string', format: 'uuid', description: 'Account being debited or credited', example: 'acc_1234567890abcdef' },
            description: { type: 'string', example: 'Rent expense for January' },
            debitAmount: { type: 'number', format: 'float', minimum: 0, example: 5000 },
            creditAmount: { type: 'number', format: 'float', minimum: 0, example: 0 },
          },
        },
        CreateInvoiceRequest: {
          type: 'object',
          required: ['type', 'customerId', 'customerName', 'date', 'dueDate', 'lineItems'],
          properties: {
            type: { type: 'string', enum: ['RECEIVABLE', 'PAYABLE'], example: 'RECEIVABLE' },
            customerId: { type: 'string', format: 'uuid', example: 'customer_001' },
            customerName: { type: 'string', minLength: 1, maxLength: 100, example: 'Acme Corporation' },
            date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            dueDate: { type: 'string', format: 'date-time', example: '2024-02-15T00:00:00.000Z' },
            lineItems: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/InvoiceLineItemInput' } },
            notes: { type: 'string', maxLength: 500, example: 'Payment terms: Net 30 days' },
          },
        },
        InvoiceLineItemInput: {
          type: 'object',
          required: ['description', 'quantity', 'unitPrice', 'taxRate'],
          properties: {
            description: { type: 'string', minLength: 1, maxLength: 500, example: 'Product A - Premium Widget' },
            quantity: { type: 'number', format: 'float', minimum: 0.01, example: 5 },
            unitPrice: { type: 'number', format: 'float', minimum: 0, example: 100 },
            taxRate: { type: 'number', format: 'float', minimum: 0, example: 10 },
          },
        },
        UpdateInvoiceRequest: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date-time', example: '2024-01-20T00:00:00.000Z' },
            dueDate: { type: 'string', format: 'date-time', example: '2024-02-20T00:00:00.000Z' },
            lineItems: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/InvoiceLineItemInput' } },
            notes: { type: 'string', maxLength: 500, example: 'Updated notes' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'inv_1234567890abcdef' },
            invoiceNumber: { type: 'string', description: 'Auto-generated invoice number', example: 'INV-20240115-0001' },
            type: { type: 'string', enum: ['RECEIVABLE', 'PAYABLE'], example: 'RECEIVABLE' },
            customerId: { type: 'string', format: 'uuid', description: 'Customer ID (AR) or Vendor ID (AP)', example: 'customer_001' },
            customerName: { type: 'string', example: 'Acme Corporation' },
            date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
            dueDate: { type: 'string', format: 'date-time', example: '2024-02-15T00:00:00.000Z' },
            lineItems: { type: 'array', items: { $ref: '#/components/schemas/InvoiceLineItem' } },
            subTotal: { type: 'number', format: 'float', description: 'Total before tax', example: 750 },
            taxAmount: { type: 'number', format: 'float', description: 'Total tax amount', example: 75 },
            totalAmount: { type: 'number', format: 'float', description: 'Subtotal + Tax', example: 825 },
            paidAmount: { type: 'number', format: 'float', description: 'Total payments recorded', example: 825 },
            outstandingAmount: { type: 'number', format: 'float', description: 'Total amount - Paid amount (calculated)', example: 0 },
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'], example: 'PAID' },
            notes: { type: 'string', nullable: true, example: 'Payment terms: Net 30' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InvoiceLineItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'ili_1234567890abcdef' },
            description: { type: 'string', example: 'Product A - Premium Widget' },
            quantity: { type: 'number', format: 'float', minimum: 0, example: 5 },
            unitPrice: { type: 'number', format: 'float', minimum: 0, example: 100 },
            taxRate: { type: 'number', format: 'float', minimum: 0, description: 'Tax percentage (e.g., 10 = 10%)', example: 10 },
            total: { type: 'number', format: 'float', description: 'Calculated: quantity * unitPrice * (1 + taxRate/100)', example: 550 },
          },
        },
        RecordPaymentRequest: {
          type: 'object',
          required: ['amount', 'paymentDate', 'paymentMethod'],
          properties: {
            amount: { type: 'number', format: 'float', minimum: 0.01, example: 825 },
            paymentDate: { type: 'string', format: 'date-time', example: '2024-01-20T00:00:00.000Z' },
            paymentMethod: { type: 'string', enum: ['BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER'], example: 'BANK_TRANSFER' },
            reference: { type: 'string', maxLength: 100, example: 'TXN-2024-001' },
            notes: { type: 'string', maxLength: 500, example: 'Payment via wire transfer' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'pay_1234567890abcdef' },
            invoiceId: { type: 'string', format: 'uuid', example: 'inv_1234567890abcdef' },
            amount: { type: 'number', format: 'float', minimum: 0, example: 825 },
            paymentDate: { type: 'string', format: 'date-time', example: '2024-01-20T00:00:00.000Z' },
            paymentMethod: { type: 'string', enum: ['BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER'], example: 'BANK_TRANSFER' },
            reference: { type: 'string', nullable: true, example: 'TXN-2024-001' },
            notes: { type: 'string', nullable: true, example: 'Payment via wire transfer' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-20T10:30:00.000Z' },
          },
        },
        BalanceSheetReport: {
          type: 'object',
          properties: {
            asOfDate: { type: 'string', format: 'date', example: '2024-01-15' },
            assets: { $ref: '#/components/schemas/AssetSection' },
            liabilities: { $ref: '#/components/schemas/LiabilitySection' },
            equity: { $ref: '#/components/schemas/EquitySection' },
            totalLiabilitiesAndEquity: { type: 'number', format: 'float', description: 'Should equal total assets', example: 650000 },
          },
        },
        AssetSection: {
          type: 'object',
          properties: {
            current: { type: 'number', format: 'float', example: 150000 },
            nonCurrent: { type: 'number', format: 'float', example: 500000 },
            total: { type: 'number', format: 'float', example: 650000 },
          },
        },
        LiabilitySection: {
          type: 'object',
          properties: {
            current: { type: 'number', format: 'float', example: 75000 },
            nonCurrent: { type: 'number', format: 'float', example: 150000 },
            total: { type: 'number', format: 'float', example: 225000 },
          },
        },
        EquitySection: {
          type: 'object',
          properties: {
            ownerCapital: { type: 'number', format: 'float', example: 350000 },
            retainedEarnings: { type: 'number', format: 'float', example: 75000 },
            total: { type: 'number', format: 'float', example: 425000 },
          },
        },
        IncomeStatementReport: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date', example: '2024-01-01' },
            endDate: { type: 'string', format: 'date', example: '2024-01-31' },
            revenue: { $ref: '#/components/schemas/RevenueSection' },
            expenses: { $ref: '#/components/schemas/ExpenseSection' },
            operatingIncome: { type: 'number', format: 'float', example: 110000 },
            otherIncome: { type: 'number', format: 'float', example: 5000 },
            netIncome: { type: 'number', format: 'float', example: 115000 },
          },
        },
        RevenueSection: {
          type: 'object',
          properties: {
            grossSales: { type: 'number', format: 'float', example: 500000 },
            salesReturns: { type: 'number', format: 'float', example: -10000 },
            netSales: { type: 'number', format: 'float', example: 490000 },
            otherRevenue: { type: 'number', format: 'float', example: 5000 },
            totalRevenue: { type: 'number', format: 'float', example: 495000 },
          },
        },
        ExpenseSection: {
          type: 'object',
          properties: {
            costOfGoodsSold: { type: 'number', format: 'float', example: 250000 },
            operatingExpenses: { type: 'number', format: 'float', example: 125000 },
            otherExpenses: { type: 'number', format: 'float', example: 10000 },
            totalExpenses: { type: 'number', format: 'float', example: 385000 },
          },
        },
        CashFlowReport: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date', example: '2024-01-01' },
            endDate: { type: 'string', format: 'date', example: '2024-01-31' },
            operatingActivities: { $ref: '#/components/schemas/CashFlowOperating' },
            investingActivities: { $ref: '#/components/schemas/CashFlowInvesting' },
            financingActivities: { $ref: '#/components/schemas/CashFlowFinancing' },
            netCashFlow: { type: 'number', format: 'float', example: 40000 },
            cashBeginning: { type: 'number', format: 'float', example: 100000 },
            cashEnding: { type: 'number', format: 'float', example: 140000 },
          },
        },
        CashFlowOperating: {
          type: 'object',
          properties: {
            netIncome: { type: 'number', format: 'float', example: 115000 },
            accountsReceivableChange: { type: 'number', format: 'float', example: -25000 },
            accountsPayableChange: { type: 'number', format: 'float', example: 15000 },
            inventoryChange: { type: 'number', format: 'float', example: -10000 },
            netCashFromOperations: { type: 'number', format: 'float', example: 95000 },
          },
        },
        CashFlowInvesting: {
          type: 'object',
          properties: {
            capitalExpenditures: { type: 'number', format: 'float', example: -50000 },
            equipmentPurchase: { type: 'number', format: 'float', example: -25000 },
            netCashFromInvesting: { type: 'number', format: 'float', example: -75000 },
          },
        },
        CashFlowFinancing: {
          type: 'object',
          properties: {
            loanProceeds: { type: 'number', format: 'float', example: 50000 },
            loanRepayment: { type: 'number', format: 'float', example: -10000 },
            dividendsPaid: { type: 'number', format: 'float', example: -20000 },
            netCashFromFinancing: { type: 'number', format: 'float', example: 20000 },
          },
        },
      },
    },
  },
  apis: [
    './modules/*/src/infrastructure/http/*Routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
