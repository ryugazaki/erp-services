import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE hr.departments (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name        varchar(100) NOT NULL UNIQUE,
      code        varchar(20) NOT NULL UNIQUE,
      description text,
      head_id     uuid REFERENCES hr.employees(id),
      is_active   boolean NOT NULL DEFAULT true,
      created_at  timestamp NOT NULL DEFAULT now(),
      updated_at  timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  await sql`CREATE INDEX idx_departments_code ON hr.departments(code)`.execute(db);

  await sql`ALTER TABLE hr.employees ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES hr.departments(id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE hr.employees DROP CONSTRAINT IF EXISTS fk_employees_department`.execute(db);
  await sql`DROP TABLE IF EXISTS hr.departments`.execute(db);
}
