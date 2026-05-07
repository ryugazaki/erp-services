interface ErrorMeta {
  status: number;
  message: string;
}

const errorMap: Record<string, ErrorMeta> = {
  // Account errors
  ACCOUNT_NOT_FOUND: { status: 404, message: 'Account not found' },
  ACCOUNT_CODE_EXISTS: { status: 409, message: 'Account code already exists' },
  ACCOUNT_CODE_INVALID: { status: 400, message: 'Invalid account code format' },
  ACCOUNT_HAS_JOURNAL_ENTRIES: { status: 409, message: 'Cannot delete account with journal entries' },
  ACCOUNT_IS_SYSTEM: { status: 409, message: 'Cannot modify system account' },
  ACCOUNT_PARENT_NOT_FOUND: { status: 404, message: 'Parent account not found' },
  ACCOUNT_CIRCULAR_REFERENCE: { status: 400, message: 'Circular reference detected in account hierarchy' },

  // Journal entry errors
  JOURNAL_ENTRY_NOT_FOUND: { status: 404, message: 'Journal entry not found' },
  JOURNAL_ENTRY_ALREADY_POSTED: { status: 409, message: 'Journal entry is already posted' },
  JOURNAL_ENTRY_NOT_POSTED: { status: 409, message: 'Journal entry is not posted' },
  JOURNAL_ENTRY_ALREADY_REVERSED: { status: 409, message: 'Journal entry is already reversed' },
  JOURNAL_ENTRY_UNBALANCED: { status: 400, message: 'Journal entry is not balanced (debits ≠ credits)' },
  JOURNAL_ENTRY_NO_LINE_ITEMS: { status: 400, message: 'Journal entry must have at least 2 line items' },
  JOURNAL_ENTRY_INVALID_ACCOUNT: { status: 400, message: 'Invalid account in line item' },

  // Invoice errors
  INVOICE_NOT_FOUND: { status: 404, message: 'Invoice not found' },
  INVOICE_NUMBER_EXISTS: { status: 409, message: 'Invoice number already exists' },
  INVOICE_NOT_DRAFT: { status: 409, message: 'Invoice is not in DRAFT status' },
  INVOICE_ALREADY_PENDING: { status: 409, message: 'Invoice is already pending' },
  INVOICE_ALREADY_PAID: { status: 409, message: 'Invoice is already paid' },
  INVOICE_OVERPAYMENT: { status: 400, message: 'Payment amount exceeds outstanding balance' },
  INVOICE_NO_LINE_ITEMS: { status: 400, message: 'Invoice must have at least 1 line item' },
  INVOICE_INVALID_STATUS_TRANSITION: { status: 400, message: 'Invalid invoice status transition' },

  // Payment errors
  PAYMENT_NOT_FOUND: { status: 404, message: 'Payment not found' },
  PAYMENT_AMOUNT_INVALID: { status: 400, message: 'Payment amount must be greater than zero' },
};

export function mapFinanceError(code: string): ErrorMeta {
  return errorMap[code] ?? { status: 500, message: 'An unexpected error occurred' };
}
