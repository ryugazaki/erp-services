import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS auth`.execute(db);

  await db.schema
    .createTable('auth.users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(50)', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamp')
    .execute();

  await db.schema
    .createTable('auth.refresh_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('auth.users(id)'))
    .addColumn('family_id', 'uuid', (col) => col.notNull())
    .addColumn('parent_token_id', 'uuid')
    .addColumn('is_used', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('is_revoked', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_family_id')
    .on('auth.refresh_tokens')
    .column('family_id')
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_user_id')
    .on('auth.refresh_tokens')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('auth.refresh_tokens').ifExists().execute();
  await db.schema.dropTable('auth.users').ifExists().execute();
  await sql`DROP SCHEMA IF EXISTS auth CASCADE`.execute(db);
}
