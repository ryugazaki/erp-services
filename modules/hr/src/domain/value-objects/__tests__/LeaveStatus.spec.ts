import { LeaveStatus } from '../LeaveStatus';

describe('LeaveStatus', () => {
  describe('create', () => {
    it('should create with "PENDING"', () => {
      const status = LeaveStatus.create('PENDING');
      expect(status.getValue()).toBe('PENDING');
    });

    it('should create with "APPROVED"', () => {
      const status = LeaveStatus.create('APPROVED');
      expect(status.getValue()).toBe('APPROVED');
    });

    it('should create with "REJECTED"', () => {
      const status = LeaveStatus.create('REJECTED');
      expect(status.getValue()).toBe('REJECTED');
    });

    it('should create with "CANCELLED"', () => {
      const status = LeaveStatus.create('CANCELLED');
      expect(status.getValue()).toBe('CANCELLED');
    });

    it('should normalize lowercase to uppercase', () => {
      const status = LeaveStatus.create('approved');
      expect(status.getValue()).toBe('APPROVED');
    });

    it('should normalize mixed case to uppercase', () => {
      const status = LeaveStatus.create('Cancelled');
      expect(status.getValue()).toBe('CANCELLED');
    });

    it('should throw for invalid status', () => {
      expect(() => LeaveStatus.create('UNKNOWN')).toThrow(
        'INVALID_LEAVE_STATUS: UNKNOWN',
      );
    });

    it('should throw for empty string', () => {
      expect(() => LeaveStatus.create('')).toThrow(
        'INVALID_LEAVE_STATUS: ',
      );
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const a = LeaveStatus.create('PENDING');
      const b = LeaveStatus.create('PENDING');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = LeaveStatus.create('PENDING');
      const b = LeaveStatus.create('pending');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different status', () => {
      const a = LeaveStatus.create('PENDING');
      const b = LeaveStatus.create('APPROVED');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the status string', () => {
      const status = LeaveStatus.create('REJECTED');
      expect(status.getValue()).toBe('REJECTED');
    });
  });

  describe('toString', () => {
    it('should return the status string', () => {
      const status = LeaveStatus.create('CANCELLED');
      expect(status.toString()).toBe('CANCELLED');
    });
  });
});
