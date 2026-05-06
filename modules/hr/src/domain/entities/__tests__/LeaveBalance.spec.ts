import { LeaveBalance } from '../LeaveBalance';

describe('LeaveBalance Entity', () => {
  const validProps = {
    employeeId: 'emp-001',
    leaveTypeId: 'lt-001',
    year: 2024,
    totalDays: 12,
  };

  describe('create', () => {
    it('should create a leave balance with valid props', () => {
      const result = LeaveBalance.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const balance = result.getValue();

      expect(balance.employeeId).toBe('emp-001');
      expect(balance.leaveTypeId).toBe('lt-001');
      expect(balance.year).toBe(2024);
      expect(balance.totalDays).toBe(12);
      expect(balance.usedDays).toBe(0);
      expect(balance.remainingDays).toBe(12);
      expect(balance.id).toBeDefined();
    });

    it('should fail with year < 2000', () => {
      const result = LeaveBalance.create({ ...validProps, year: 1999 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_YEAR');
    });

    it('should fail with totalDays <= 0', () => {
      const result = LeaveBalance.create({ ...validProps, totalDays: 0 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_TOTAL_DAYS');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'lb-001',
        employeeId: 'emp-002',
        leaveTypeId: 'lt-002',
        year: 2024,
        totalDays: 15,
        usedDays: 5,
        remainingDays: 10,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
      };

      const balance = LeaveBalance.reconstitute(state);

      expect(balance.id).toBe(state.id);
      expect(balance.employeeId).toBe(state.employeeId);
      expect(balance.leaveTypeId).toBe(state.leaveTypeId);
      expect(balance.year).toBe(state.year);
      expect(balance.totalDays).toBe(state.totalDays);
      expect(balance.usedDays).toBe(state.usedDays);
      expect(balance.remainingDays).toBe(state.remainingDays);
      expect(balance.createdAt).toEqual(state.createdAt);
      expect(balance.updatedAt).toEqual(state.updatedAt);
    });
  });

  describe('use', () => {
    it('should reduce remaining and increase used days', () => {
      const balance = LeaveBalance.create(validProps).getValue();

      const result = balance.use(3);

      expect(result.isSuccess()).toBe(true);
      expect(balance.usedDays).toBe(3);
      expect(balance.remainingDays).toBe(9);
    });

    it('should fail with days <= 0', () => {
      const balance = LeaveBalance.create(validProps).getValue();

      const result = balance.use(0);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_BALANCE_INVALID_DAYS');
    });

    it('should fail when insufficient balance', () => {
      const balance = LeaveBalance.create(validProps).getValue();

      const result = balance.use(13);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INSUFFICIENT_LEAVE_BALANCE');
    });
  });

  describe('restore', () => {
    it('should increase remaining and decrease used days', () => {
      const balance = LeaveBalance.create(validProps).getValue();
      balance.use(5);

      const result = balance.restore(3);

      expect(result.isSuccess()).toBe(true);
      expect(balance.usedDays).toBe(2);
      expect(balance.remainingDays).toBe(10);
    });

    it('should fail with days <= 0', () => {
      const balance = LeaveBalance.create(validProps).getValue();

      const result = balance.restore(-1);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_BALANCE_INVALID_DAYS');
    });
  });
});
