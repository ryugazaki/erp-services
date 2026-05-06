import { EmployeeStatus } from '../EmployeeStatus';

describe('EmployeeStatus', () => {
  describe('create', () => {
    it('should create with "ACTIVE"', () => {
      const status = EmployeeStatus.create('ACTIVE');
      expect(status.getValue()).toBe('ACTIVE');
    });

    it('should normalize lowercase "active" to "ACTIVE"', () => {
      const status = EmployeeStatus.create('active');
      expect(status.getValue()).toBe('ACTIVE');
    });

    it('should create with "INACTIVE"', () => {
      const status = EmployeeStatus.create('INACTIVE');
      expect(status.getValue()).toBe('INACTIVE');
    });

    it('should create with "SUSPENDED"', () => {
      const status = EmployeeStatus.create('SUSPENDED');
      expect(status.getValue()).toBe('SUSPENDED');
    });

    it('should create with "TERMINATED"', () => {
      const status = EmployeeStatus.create('TERMINATED');
      expect(status.getValue()).toBe('TERMINATED');
    });

    it('should throw for invalid status', () => {
      expect(() => EmployeeStatus.create('UNKNOWN')).toThrow(
        'INVALID_EMPLOYEE_STATUS: UNKNOWN',
      );
    });

    it('should throw for empty string', () => {
      expect(() => EmployeeStatus.create('')).toThrow(
        'INVALID_EMPLOYEE_STATUS: ',
      );
    });

    it('should normalize mixed case to uppercase', () => {
      const status = EmployeeStatus.create('Suspended');
      expect(status.getValue()).toBe('SUSPENDED');
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const a = EmployeeStatus.create('ACTIVE');
      const b = EmployeeStatus.create('ACTIVE');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = EmployeeStatus.create('ACTIVE');
      const b = EmployeeStatus.create('active');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different status', () => {
      const a = EmployeeStatus.create('ACTIVE');
      const b = EmployeeStatus.create('INACTIVE');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the status string', () => {
      const status = EmployeeStatus.create('TERMINATED');
      expect(status.getValue()).toBe('TERMINATED');
    });
  });

  describe('toString', () => {
    it('should return the status string', () => {
      const status = EmployeeStatus.create('SUSPENDED');
      expect(status.toString()).toBe('SUSPENDED');
    });
  });
});
