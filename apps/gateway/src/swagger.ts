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
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', minLength: 8, example: 'MyP@ssw0rd!' },
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
      },
    },
  },
  apis: [
    './modules/*/src/infrastructure/http/*Routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
