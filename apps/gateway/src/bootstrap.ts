import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { DatabaseConnection } from '@erp/core/database';
import { RabbitMQEventBus } from '@erp/core/event-bus';
import { ModuleRegistry } from '@erp/core/module-registry';
import { AuthModule } from '@erp/module/auth';
import { HRModule } from '@erp/module/hr';
import { InventoryModule } from '@erp/module/inventory';
import { FinanceModule } from '@erp/module/finance';
import { Logger } from '@erp/shared/utils';
import { errorMiddleware } from './app';
import { healthRouter } from './routes/health';
import { swaggerSpec } from './swagger';

export async function bootstrap(app: Express) {
  const dbConnection = new DatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'erp_admin',
    password: process.env.DB_PASSWORD || 'erp_secret_dev',
    database: process.env.DB_NAME || 'erp_system',
  });

  const eventBus = new RabbitMQEventBus(
    process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  );

  const registry = new ModuleRegistry();

  // Register Auth module
  const authModule = new AuthModule({
    db: dbConnection.getDb(),
    eventBus,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  });

  await authModule.register(null);
  await registry.register(authModule);

  // Register HR module
  const hrModule = new HRModule({
    db: dbConnection.getDb(),
    eventBus,
  });

  await hrModule.register(null);
  await registry.register(hrModule);

  // Register Inventory module
  const inventoryModule = new InventoryModule({
    db: dbConnection.getDb(),
    eventBus,
  });

  await inventoryModule.register(null);
  await registry.register(inventoryModule);

  // Register Finance module
  const financeModule = new FinanceModule({
    db: dbConnection.getDb(),
    eventBus,
  });

  await financeModule.register(null);
  await registry.register(financeModule);

  // Mount health route
  app.use('/health', healthRouter);

  // Mount Swagger API docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  Logger.info('Swagger UI mounted', { path: '/api-docs' });

  // Mount all module routes under /v1/:module
  const allRoutes = registry.getAllRoutes();
  for (const { prefix, router } of allRoutes) {
    app.use(`/v1/${prefix}`, router);
    Logger.info(`Module routes mounted`, { prefix: `/v1/${prefix}` });
  }

  // Error middleware must be last
  app.use(errorMiddleware);

  Logger.info('Gateway bootstrap complete');

  return {
    dbConnection,
    eventBus,
    registry,
    async close() {
      await registry.unregister('finance');
      await registry.unregister('inventory');
      await registry.unregister('hr');
      await registry.unregister('auth');
      await eventBus.close();
      await dbConnection.close();
    },
  };
}
