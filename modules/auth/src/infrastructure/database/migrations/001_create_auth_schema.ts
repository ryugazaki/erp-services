import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS auth`.execute(db);

  await sql`
    CREATE TABLE auth.users (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email       varchar(255) NOT NULL UNIQUE,
      password_hash varchar(255) NOT NULL,
      role        varchar(50) NOT NULL,
      is_active   boolean NOT NULL DEFAULT true,
      created_at  timestamp NOT NULL DEFAULT now(),
      updated_at  timestamp NOT NULL DEFAULT now(),
      deleted_at  timestamp
    )
  `.execute(db);

  await sql`
    CREATE TABLE auth.refresh_tokens (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         uuid NOT NULL REFERENCES auth.users(id),
      family_id       uuid NOT NULL,
      parent_token_id uuid,
      is_used         boolean NOT NULL DEFAULT false,
      is_revoked      boolean NOT NULL DEFAULT false,
      expires_at      timestamp NOT NULL,
      created_at      timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  await sql`CREATE INDEX idx_refresh_tokens_family_id ON auth.refresh_tokens (family_id)`.execute(db);
  await sql`CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens (user_id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS auth.refresh_tokens`.execute(db);
  await sql`DROP TABLE IF EXISTS auth.users`.execute(db);
  await sql`DROP SCHEMA IF EXISTS auth CASCADE`.execute(db);
}
