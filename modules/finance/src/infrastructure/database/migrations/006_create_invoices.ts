import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create invoices table
  await sql`
    CREATE TABLE IF NOT EXISTS finance.invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_number VARCHAR(50) NOT NULL UNIQUE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('RECEIVABLE', 'PAYABLE')),
      customer_id UUID NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      due_date DATE NOT NULL,
      sub_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
      tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);

  // Create invoice_line_items table
  await sql`
    CREATE TABLE IF NOT EXISTS finance.invoice_line_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL,
      unit_price DECIMAL(15, 2) NOT NULL,
      tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
      total DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);

  // Create payments table
  await sql`
    CREATE TABLE IF NOT EXISTS finance.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
      amount DECIMAL(15, 2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER')),
      reference VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);

  // Create indexes for invoices
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON finance.invoices(invoice_number)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_type ON finance.invoices(type)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON finance.invoices(status)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer ON finance.invoices(customer_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_date ON finance.invoices(date)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON finance.invoices(due_date)`.execute(db);

  // Create indexes for invoice_line_items
  await sql`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON finance.invoice_line_items(invoice_id)`.execute(db);

  // Create indexes for payments
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON finance.payments(invoice_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON finance.payments(payment_date)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS finance.payments`.execute(db);
  await sql`DROP TABLE IF EXISTS finance.invoice_line_items`.execute(db);
  await sql`DROP TABLE IF EXISTS finance.invoices`.execute(db);
}
