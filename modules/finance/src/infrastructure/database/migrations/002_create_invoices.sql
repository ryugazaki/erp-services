-- Finance Module Migration 002
-- Create invoices, invoice_line_items, and payments tables

-- Create invoices table
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
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS finance.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS finance.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER')),
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON finance.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON finance.invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON finance.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON finance.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON finance.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON finance.invoices(due_date);

-- Create indexes for invoice_line_items
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON finance.invoice_line_items(invoice_id);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON finance.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON finance.payments(payment_date);

-- Add comments for documentation
COMMENT ON TABLE finance.invoices IS 'Invoices - stores accounts receivable and payable invoices';
COMMENT ON TABLE finance.invoice_line_items IS 'Invoice line items - stores individual line items for each invoice';
COMMENT ON TABLE finance.payments IS 'Payments - stores payment records for invoices';
