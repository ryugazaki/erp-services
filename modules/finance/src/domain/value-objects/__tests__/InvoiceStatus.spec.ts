import { InvoiceStatus } from '../InvoiceStatus';

describe('InvoiceStatus', () => {
  describe('create', () => {
    it('should create with "DRAFT"', () => {
      const status = InvoiceStatus.create('DRAFT');
      expect(status.getValue()).toBe('DRAFT');
    });

    it('should create with "PENDING"', () => {
      const status = InvoiceStatus.create('PENDING');
      expect(status.getValue()).toBe('PENDING');
    });

    it('should create with "PAID"', () => {
      const status = InvoiceStatus.create('PAID');
      expect(status.getValue()).toBe('PAID');
    });

    it('should create with "OVERDUE"', () => {
      const status = InvoiceStatus.create('OVERDUE');
      expect(status.getValue()).toBe('OVERDUE');
    });

    it('should create with "CANCELLED"', () => {
      const status = InvoiceStatus.create('CANCELLED');
      expect(status.getValue()).toBe('CANCELLED');
    });

    it('should normalize lowercase to uppercase', () => {
      const status = InvoiceStatus.create('draft');
      expect(status.getValue()).toBe('DRAFT');
    });

    it('should throw for invalid status', () => {
      expect(() => InvoiceStatus.create('UNKNOWN')).toThrow('INVALID_INVOICE_STATUS: UNKNOWN');
    });

    it('should throw for empty string', () => {
      expect(() => InvoiceStatus.create('')).toThrow('INVALID_INVOICE_STATUS: ');
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const a = InvoiceStatus.create('PENDING');
      const b = InvoiceStatus.create('PENDING');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = InvoiceStatus.create('PENDING');
      const b = InvoiceStatus.create('pending');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different status', () => {
      const a = InvoiceStatus.create('PENDING');
      const b = InvoiceStatus.create('PAID');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the status string', () => {
      const status = InvoiceStatus.create('PAID');
      expect(status.getValue()).toBe('PAID');
    });
  });

  describe('toString', () => {
    it('should return the status string', () => {
      const status = InvoiceStatus.create('CANCELLED');
      expect(status.toString()).toBe('CANCELLED');
    });
  });
});
