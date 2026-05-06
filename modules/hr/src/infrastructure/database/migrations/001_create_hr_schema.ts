import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS hr`.execute(db);

  await sql`
    CREATE TABLE hr.employees (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_number varchar(20) NOT NULL UNIQUE,
      first_name      varchar(100) NOT NULL,
      last_name       varchar(100) NOT NULL,
      email           varchar(255) NOT NULL UNIQUE,
      phone           varchar(20),
      department_id   uuid,
      position        varchar(100),
      hire_date       date NOT NULL,
      status          varchar(20) NOT NULL DEFAULT 'ACTIVE',
      user_id         uuid REFERENCES auth.users(id),
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now(),
      deleted_at      timestamp
    )
  `.execute(db);

  await sql`
    CREATE TABLE hr.leave_types (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name            varchar(50) NOT NULL UNIQUE,
      code            varchar(20) NOT NULL UNIQUE,
      description     text,
      default_days    integer NOT NULL DEFAULT 0,
      is_paid         boolean NOT NULL DEFAULT true,
      is_active       boolean NOT NULL DEFAULT true,
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  await sql`
    CREATE TABLE hr.leave_balances (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id     uuid NOT NULL REFERENCES hr.employees(id),
      leave_type_id   uuid NOT NULL REFERENCES hr.leave_types(id),
      year            integer NOT NULL,
      total_days      numeric(5,1) NOT NULL DEFAULT 0,
      used_days       numeric(5,1) NOT NULL DEFAULT 0,
      remaining_days  numeric(5,1) NOT NULL DEFAULT 0,
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now(),
      UNIQUE(employee_id, leave_type_id, year)
    )
  `.execute(db);

  await sql`
    CREATE TABLE hr.leaves (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id     uuid NOT NULL REFERENCES hr.employees(id),
      leave_type_id   uuid NOT NULL REFERENCES hr.leave_types(id),
      start_date      date NOT NULL,
      end_date        date NOT NULL,
      total_days      numeric(5,1) NOT NULL,
      reason          text,
      status          varchar(20) NOT NULL DEFAULT 'PENDING',
      approved_by     uuid,
      approved_at     timestamp,
      remarks         text,
      cancelled_at    timestamp,
      created_at      timestamp NOT NULL DEFAULT now(),
      updated_at      timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  await sql`CREATE INDEX idx_employees_user_id ON hr.employees(user_id)`.execute(db);
  await sql`CREATE INDEX idx_employees_status ON hr.employees(status)`.execute(db);
  await sql`CREATE INDEX idx_leave_balances_employee ON hr.leave_balances(employee_id, year)`.execute(db);
  await sql`CREATE INDEX idx_leaves_employee ON hr.leaves(employee_id)`.execute(db);
  await sql`CREATE INDEX idx_leaves_status ON hr.leaves(status)`.execute(db);
  await sql`CREATE INDEX idx_leaves_date_range ON hr.leaves(start_date, end_date)`.execute(db);

  await sql`
    INSERT INTO hr.leave_types (id, name, code, description, default_days, is_paid) VALUES
      ('00000000-0000-0000-0000-000000000001', 'Annual Leave', 'ANNUAL', 'Annual paid leave', 12, true),
      ('00000000-0000-0000-0000-000000000002', 'Sick Leave', 'SICK', 'Sick leave', 10, true),
      ('00000000-0000-0000-0000-000000000003', 'Maternity Leave', 'MATERNITY', 'Maternity leave', 90, true),
      ('00000000-0000-0000-0000-000000000004', 'Paternity Leave', 'PATERNITY', 'Paternity leave', 7, true),
      ('00000000-0000-0000-0000-000000000005', 'Unpaid Leave', 'UNPAID', 'Leave without pay', 0, false)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS hr.leaves`.execute(db);
  await sql`DROP TABLE IF EXISTS hr.leave_balances`.execute(db);
  await sql`DROP TABLE IF EXISTS hr.leave_types`.execute(db);
  await sql`DROP TABLE IF EXISTS hr.employees`.execute(db);
  await sql`DROP SCHEMA IF EXISTS hr CASCADE`.execute(db);
}
