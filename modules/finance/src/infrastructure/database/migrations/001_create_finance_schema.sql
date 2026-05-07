-- Finance Module Migration 001
-- Create finance schema and core tables: accounts, journal_entries, journal_line_items

-- Create finance schema
CREATE SCHEMA IF NOT EXISTS finance;

-- Create accounts table (Chart of Accounts)
CREATE TABLE IF NOT EXISTS finance.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  parent_id UUID REFERENCES finance.accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system_account BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS finance.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID,
  reversal_entry_id UUID REFERENCES finance.journal_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create journal_line_items table
CREATE TABLE IF NOT EXISTS finance.journal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES finance.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance.accounts(id) ON DELETE RESTRICT,
  description TEXT,
  debit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_code ON finance.accounts(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_type ON finance.accounts(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON finance.accounts(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON finance.accounts(is_active) WHERE deleted_at IS NULL;

-- Create indexes for journal_entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON finance.journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON finance.journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_number ON finance.journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_posted_by ON finance.journal_entries(posted_by);

-- Create indexes for journal_line_items
CREATE INDEX IF NOT EXISTS idx_journal_line_items_entry ON finance.journal_line_items(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_line_items_account ON finance.journal_line_items(account_id);

-- Insert default Chart of Accounts
INSERT INTO finance.accounts (code, name, description, type, is_system_account) VALUES
  -- Assets (1xxx)
  ('1', 'ASSETS', 'All Asset Accounts', 'ASSET', TRUE),
  ('1-1000', 'Current Assets', 'Assets that can be converted to cash within one year', 'ASSET', TRUE),
  ('1-1001', 'Cash', 'Cash on hand and in banks', 'ASSET', TRUE),
  ('1-1100', 'Accounts Receivable', 'Money owed by customers', 'ASSET', TRUE),
  ('1-1200', 'Inventory', 'Goods held for sale', 'ASSET', TRUE),
  ('1-2000', 'Fixed Assets', 'Long-term tangible assets', 'ASSET', TRUE),
  ('1-2001', 'Equipment', 'Machinery and equipment', 'ASSET', TRUE),
  ('1-2002', 'Accumulated Depreciation - Equipment', 'Accumulated depreciation on equipment', 'ASSET', TRUE),

  -- Liabilities (2xxx)
  ('2', 'LIABILITIES', 'All Liability Accounts', 'LIABILITY', TRUE),
  ('2-1000', 'Current Liabilities', 'Debts due within one year', 'LIABILITY', TRUE),
  ('2-1001', 'Accounts Payable', 'Money owed to suppliers', 'LIABILITY', TRUE),
  ('2-1100', 'Accrued Expenses', 'Expenses incurred but not yet paid', 'LIABILITY', TRUE),
  ('2-2000', 'Long-term Liabilities', 'Debts due after one year', 'LIABILITY', TRUE),
  ('2-2001', 'Loans Payable', 'Long-term loans', 'LIABILITY', TRUE),

  -- Equity (3xxx)
  ('3', 'EQUITY', 'All Equity Accounts', 'EQUITY', TRUE),
  ('3-1000', 'Owner Equity', 'Owner investment', 'EQUITY', TRUE),
  ('3-1001', 'Capital', 'Owner capital investment', 'EQUITY', TRUE),
  ('3-2000', 'Retained Earnings', 'Accumulated profits', 'EQUITY', TRUE),
  ('3-3000', 'Current Year Earnings', 'Current year profit or loss', 'EQUITY', TRUE),

  -- Revenue (4xxx)
  ('4', 'REVENUE', 'All Revenue Accounts', 'REVENUE', TRUE),
  ('4-1000', 'Operating Revenue', 'Revenue from primary operations', 'REVENUE', TRUE),
  ('4-1001', 'Sales Revenue', 'Revenue from product sales', 'REVENUE', TRUE),
  ('4-1002', 'Service Revenue', 'Revenue from services', 'REVENUE', TRUE),
  ('4-2000', 'Other Revenue', 'Non-operating revenue', 'REVENUE', TRUE),
  ('4-2001', 'Interest Income', 'Interest earned', 'REVENUE', TRUE),

  -- Expenses (5xxx)
  ('5', 'EXPENSES', 'All Expense Accounts', 'EXPENSE', TRUE),
  ('5-1000', 'Cost of Goods Sold', 'Direct costs of producing goods', 'EXPENSE', TRUE),
  ('5-2000', 'Operating Expenses', 'Day-to-day business expenses', 'EXPENSE', TRUE),
  ('5-2001', 'Salaries and Wages', 'Employee compensation', 'EXPENSE', TRUE),
  ('5-2002', 'Rent Expense', 'Rent for facilities', 'EXPENSE', TRUE),
  ('5-2003', 'Utilities Expense', 'Electricity, water, gas', 'EXPENSE', TRUE),
  ('5-3000', 'Other Expenses', 'Non-operating expenses', 'EXPENSE', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Update parent_id for child accounts
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '1') WHERE code IN ('1-1000', '1-2000');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '1-1000') WHERE code IN ('1-1001', '1-1100', '1-1200');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '1-2000') WHERE code IN ('1-2001', '1-2002');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '2') WHERE code IN ('2-1000', '2-2000');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '2-1000') WHERE code IN ('2-1001', '2-1100');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '2-2000') WHERE code IN ('2-2001');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '3') WHERE code IN ('3-1000', '3-2000', '3-3000');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '3-1000') WHERE code = '3-1001';
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '4') WHERE code IN ('4-1000', '4-2000');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '4-1000') WHERE code IN ('4-1001', '4-1002');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '4-2000') WHERE code = '4-2001';
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '5') WHERE code IN ('5-1000', '5-2000', '5-3000');
UPDATE finance.accounts SET parent_id = (SELECT id FROM finance.accounts WHERE code = '5-2000') WHERE code IN ('5-2001', '5-2002', '5-2003');

-- Add comments for documentation
COMMENT ON TABLE finance.accounts IS 'Chart of Accounts - stores all account types for double-entry bookkeeping';
COMMENT ON TABLE finance.journal_entries IS 'Journal entries - stores all accounting transactions';
COMMENT ON TABLE finance.journal_line_items IS 'Journal line items - stores debits and credits for each journal entry';
