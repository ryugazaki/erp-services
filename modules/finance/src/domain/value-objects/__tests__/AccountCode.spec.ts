import { AccountCode } from '../AccountCode';

describe('AccountCode Value Object', () => {
  describe('create', () => {
    it('should create valid account code with segment separator', () => {
      const code = AccountCode.create('1-1001');
      expect(code.getValue()).toBe('1-1001');
    });

    it('should create valid account code with multiple segments', () => {
      const code = AccountCode.create('1-1001-001');
      expect(code.getValue()).toBe('1-1001-001');
    });

    it('should normalize whitespace', () => {
      const code = AccountCode.create('1 - 1001');
      expect(code.getValue()).toBe('1-1001');
    });

    it('should throw for empty string', () => {
      expect(() => AccountCode.create('')).toThrow('INVALID_ACCOUNT_CODE: Account code cannot be empty');
    });

    it('should throw for code without segments', () => {
      expect(() => AccountCode.create('11001')).toThrow('INVALID_ACCOUNT_CODE: Account code must contain segments separated by hyphen');
    });

    it('should throw for code with invalid characters', () => {
      expect(() => AccountCode.create('1-ABC')).toThrow('INVALID_ACCOUNT_CODE: Account code segments must be numeric');
    });

    it('should throw for code starting with separator', () => {
      expect(() => AccountCode.create('-1001')).toThrow('INVALID_ACCOUNT_CODE: Account code cannot start with separator');
    });

    it('should throw for code ending with separator', () => {
      expect(() => AccountCode.create('1-')).toThrow('INVALID_ACCOUNT_CODE: Account code cannot end with separator');
    });
  });

  describe('validateHierarchy', () => {
    it('should validate correct parent-child relationship', () => {
      const parent = AccountCode.create('1-1000');
      const child = AccountCode.create('1-1000-001');
      expect(child.validateParent(parent)).toBe(true);
    });

    it('should reject incorrect parent-child relationship', () => {
      const parent = AccountCode.create('1-1000');
      const child = AccountCode.create('1-2000-001');
      expect(child.validateParent(parent)).toBe(false);
    });

    it('should reject when child has fewer segments than parent', () => {
      const parent = AccountCode.create('1-1000-001');
      const child = AccountCode.create('1-1000');
      expect(child.validateParent(parent)).toBe(false);
    });

    it('should reject when child is not a descendant of parent', () => {
      const parent = AccountCode.create('1-1000');
      const child = AccountCode.create('2-2000-001');
      expect(child.validateParent(parent)).toBe(false);
    });
  });

  describe('getSegments', () => {
    it('should return array of segments', () => {
      const code = AccountCode.create('1-1001-001');
      expect(code.getValue().getSegments()).toEqual(['1', '1001', '001']);
    });

    it('should return single segment for simple code', () => {
      const code = AccountCode.create('1-1001');
      expect(code.getValue().getSegments()).toEqual(['1', '1001']);
    });
  });

  describe('getLevel', () => {
    it('should return correct level for root account', () => {
      const code = AccountCode.create('1-1001');
      expect(code.getValue().getLevel()).toBe(1);
    });

    it('should return correct level for child account', () => {
      const code = AccountCode.create('1-1001-001');
      expect(code.getValue().getLevel()).toBe(2);
    });

    it('should return correct level for deeply nested account', () => {
      const code = AccountCode.create('1-1001-001-001');
      expect(code.getValue().getLevel()).toBe(3);
    });
  });

  describe('equals', () => {
    it('should return true for same code', () => {
      const a = AccountCode.create('1-1001');
      const b = AccountCode.create('1-1001');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different code', () => {
      const a = AccountCode.create('1-1001');
      const b = AccountCode.create('1-1002');
      expect(a.equals(b)).toBe(false);
    });

    it('should return true for normalized codes', () => {
      const a = AccountCode.create('1 - 1001');
      const b = AccountCode.create('1-1001');
      expect(a.equals(b)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the code string', () => {
      const code = AccountCode.create('1-1001');
      expect(code.toString()).toBe('1-1001');
    });
  });
});
