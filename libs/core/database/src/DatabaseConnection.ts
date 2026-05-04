import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Logger } from '@erp/shared/utils';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxConnections?: number;
}

export class DatabaseConnection {
  private db: Kysely<any>;

  constructor(config: DatabaseConfig) {
    this.db = new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database,
          max: config.maxConnections ?? 10,
        }),
      }),
    });

    Logger.info('Database connection initialized', {
      host: config.host,
      port: config.port,
      database: config.database,
    });
  }

  getDb(): Kysely<any> {
    return this.db;
  }

  async close(): Promise<void> {
    await this.db.destroy();
    Logger.info('Database connection closed');
  }
}
