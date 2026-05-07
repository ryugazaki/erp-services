import { InvoiceType } from '../InvoiceType';

describe('InvoiceType', () => {
  describe('create', () => {
    it('should create with "RECEIVABLE"', () => {
      const type = InvoiceType.create('RECEIVABLE');
      expect(type.getValue()).toBe('RECEIVABLE');
    });

    it('should create with "PAYABLE"', () => {
      const type = InvoiceType.create('PAYABLE');
      expect(type.getValue()).toBe('PAYABLE');
    });

    it('should normalize lowercase to uppercase', () => {
      const type = InvoiceType.create('receivable');
      expect(type.getValue()).toBe('RECEIVABLE');
    });

    it('should throw for invalid type', () => {
      expect(() => InvoiceType.create('UNKNOWN')).toThrow('INVALID_INVOICE_TYPE: UNKNOWN');
    });

    it('should throw for empty string', () => {
      expect(() => InvoiceType.create('')).toThrow('INVALID_INVOICE_TYPE: ');
    });
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const a = InvoiceType.create('RECEIVABLE');
      const b = InvoiceType.create('RECEIVABLE');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = InvoiceType.create('RECEIVABLE');
      const b = InvoiceType.create('receivable');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different type', () => {
      const a = InvoiceType.create('RECEIVABLE');
      const b = InvoiceType.create('PAYABLE');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the type string', () => {
      const type = InvoiceType.create('PAYABLE');
      expect(type.getValue()).toBe('PAYABLE');
    });
  });

  describe('toString', () => {
    it('should return the type string', () => {
      const type = InvoiceType.create('RECEIVABLE');
      expect(type.toString()).toBe('RECEIVABLE');
    });
  });
});
