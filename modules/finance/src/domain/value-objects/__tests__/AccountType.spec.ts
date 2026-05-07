import { AccountType } from '../AccountType';

describe('AccountType', () => {
  describe('create', () => {
    it('should create with "ASSET"', () => {
      const type = AccountType.create('ASSET');
      expect(type.getValue()).toBe('ASSET');
    });

    it('should create with "LIABILITY"', () => {
      const type = AccountType.create('LIABILITY');
      expect(type.getValue()).toBe('LIABILITY');
    });

    it('should create with "EQUITY"', () => {
      const type = AccountType.create('EQUITY');
      expect(type.getValue()).toBe('EQUITY');
    });

    it('should create with "REVENUE"', () => {
      const type = AccountType.create('REVENUE');
      expect(type.getValue()).toBe('REVENUE');
    });

    it('should create with "EXPENSE"', () => {
      const type = AccountType.create('EXPENSE');
      expect(type.getValue()).toBe('EXPENSE');
    });

    it('should normalize lowercase to uppercase', () => {
      const type = AccountType.create('asset');
      expect(type.getValue()).toBe('ASSET');
    });

    it('should throw for invalid type', () => {
      expect(() => AccountType.create('UNKNOWN')).toThrow('INVALID_ACCOUNT_TYPE: UNKNOWN');
    });

    it('should throw for empty string', () => {
      expect(() => AccountType.create('')).toThrow('INVALID_ACCOUNT_TYPE: ');
    });
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const a = AccountType.create('ASSET');
      const b = AccountType.create('ASSET');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = AccountType.create('ASSET');
      const b = AccountType.create('asset');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different type', () => {
      const a = AccountType.create('ASSET');
      const b = AccountType.create('LIABILITY');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the type string', () => {
      const type = AccountType.create('REVENUE');
      expect(type.getValue()).toBe('REVENUE');
    });
  });

  describe('toString', () => {
    it('should return the type string', () => {
      const type = AccountType.create('EXPENSE');
      expect(type.toString()).toBe('EXPENSE');
    });
  });
});
