import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { Kysely, Migrator } from 'kysely';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'erp_admin',
        password: process.env.DB_PASSWORD || 'erp_secret_dev',
        database: process.env.DB_NAME || 'erp_system',
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        const modulesDir = path.join(__dirname, '../../modules');
        const moduleDirs = fs.readdirSync(modulesDir);
        const migrations: Record<string, any> = {};

        for (const mod of moduleDirs) {
          const migrationsDir = path.join(modulesDir, mod, 'src/infrastructure/database/migrations');
          if (!fs.existsSync(migrationsDir)) continue;

          const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
          for (const file of files) {
            const migration = require(path.join(migrationsDir, file));
            migrations[file.replace('.ts', '').replace('.js', '')] = migration;
          }
        }

        return migrations;
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executed successfully`);
    } else if (result.status === 'Error') {
      console.error(`Migration "${result.migrationName}" failed`);
    }
  });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await db.destroy();
  console.log('All migrations completed');
}

main();
