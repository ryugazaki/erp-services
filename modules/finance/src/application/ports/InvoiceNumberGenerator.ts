export interface InvoiceNumberGenerator {
  generate(type: 'RECEIVABLE' | 'PAYABLE'): Promise<string>;
}
