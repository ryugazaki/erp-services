import { Result } from '@erp/shared/kernel';
import { EmployeeNumber } from '../EmployeeNumber';

describe('EmployeeNumber', () => {
  describe('create', () => {
    it('should create with valid format "EMP-00001"', () => {
      const result = EmployeeNumber.create('EMP-00001');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('EMP-00001');
    });

    it('should create with valid format "ABC123"', () => {
      const result = EmployeeNumber.create('ABC123');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('ABC123');
    });

    it('should create with valid format "test-value_123"', () => {
      const result = EmployeeNumber.create('test-value_123');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('test-value_123');
    });

    it('should fail with empty string', () => {
      const result = EmployeeNumber.create('');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('EMPLOYEE_NUMBER_EMPTY');
    });

    it('should fail with whitespace only', () => {
      const result = EmployeeNumber.create('   ');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('EMPLOYEE_NUMBER_EMPTY');
    });

    it('should fail with string longer than 20 characters', () => {
      const result = EmployeeNumber.create('abcdefghijklmnopqrstu');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('EMPLOYEE_NUMBER_TOO_LONG');
    });

    it('should fail with special characters like @#$', () => {
      const result = EmployeeNumber.create('EMP@#$');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('EMPLOYEE_NUMBER_INVALID_FORMAT');
    });

    it('should trim whitespace from valid input', () => {
      const result = EmployeeNumber.create('  EMP-00001  ');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('EMP-00001');
    });

    it('should fail with exactly 21 characters (over limit)', () => {
      const long = 'A'.repeat(21);
      const result = EmployeeNumber.create(long);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('EMPLOYEE_NUMBER_TOO_LONG');
    });

    it('should succeed with exactly 20 characters (at limit)', () => {
      const exact = 'A'.repeat(20);
      const result = EmployeeNumber.create(exact);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe(exact);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = EmployeeNumber.create('EMP-001').getValue();
      const b = EmployeeNumber.create('EMP-001').getValue();
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different value', () => {
      const a = EmployeeNumber.create('EMP-001').getValue();
      const b = EmployeeNumber.create('EMP-002').getValue();
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the value', () => {
      const emp = EmployeeNumber.create('EMP-00001').getValue();
      expect(emp.toString()).toBe('EMP-00001');
    });
  });
});
