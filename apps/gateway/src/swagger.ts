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
      },
    },
  },
  apis: [
    './modules/*/src/infrastructure/http/*Routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
