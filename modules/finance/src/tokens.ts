export const TOKENS = {
  AccountRepository:      Symbol('IAccountRepository'),
  JournalEntryRepository: Symbol('IJournalEntryRepository'),
  InvoiceRepository:      Symbol('IInvoiceRepository'),
  PaymentRepository:      Symbol('IPaymentRepository'),
  EntryNumberGenerator:   Symbol('IEntryNumberGenerator'),
  InvoiceNumberGenerator: Symbol('IInvoiceNumberGenerator'),
  EventBus:               Symbol('IEventBus'),
} as const;
