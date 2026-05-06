import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE hr.attendances (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id     uuid NOT NULL REFERENCES hr.employees(id),
      date            date NOT NULL,
      clocked_in_at   timestamp NOT NULL,
      clocked_out_at  timestamp,
      status          varchar(20) NOT NULL DEFAULT 'CLOCKED_IN',
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now(),
      UNIQUE(employee_id, date)
    )
  `.execute(db);

  await sql`CREATE INDEX idx_attendances_employee ON hr.attendances(employee_id)`.execute(db);
  await sql`CREATE INDEX idx_attendances_date ON hr.attendances(date)`.execute(db);
  await sql`CREATE INDEX idx_attendances_status ON hr.attendances(status)`.execute(db);
  await sql`CREATE INDEX idx_attendances_employee_date ON hr.attendances(employee_id, date)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS hr.attendances`.execute(db);
}
