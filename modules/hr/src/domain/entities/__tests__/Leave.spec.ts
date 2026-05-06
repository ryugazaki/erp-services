import { Leave } from '../Leave';

describe('Leave Entity', () => {
  const validProps = {
    employeeId: 'emp-001',
    leaveTypeId: 'lt-001',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-03'),
    totalDays: 3,
    reason: 'Family vacation',
  };

  describe('create', () => {
    it('should create a leave with valid props', () => {
      const result = Leave.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const leave = result.getValue();

      expect(leave.employeeId).toBe('emp-001');
      expect(leave.leaveTypeId).toBe('lt-001');
      expect(leave.startDate).toEqual(new Date('2024-06-01'));
      expect(leave.endDate).toEqual(new Date('2024-06-03'));
      expect(leave.totalDays).toBe(3);
      expect(leave.reason).toBe('Family vacation');
      expect(leave.status).toBe('PENDING');
      expect(leave.id).toBeDefined();
      expect(leave.createdAt).toBeDefined();
      expect(leave.updatedAt).toBeDefined();

      const events = leave.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.leave.applied');
    });

    it('should fail with totalDays <= 0', () => {
      const result = Leave.create({ ...validProps, totalDays: 0 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_TOTAL_DAYS');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'leave-001',
        employeeId: 'emp-002',
        leaveTypeId: 'lt-002',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-05'),
        totalDays: 5,
        reason: 'Conference',
        status: 'APPROVED',
        approvedBy: 'mgr-001',
        approvedAt: new Date('2024-06-25T10:00:00Z'),
        remarks: 'Approved by manager',
        cancelledAt: null,
        createdAt: new Date('2024-06-20T00:00:00Z'),
        updatedAt: new Date('2024-06-25T10:00:00Z'),
      };

      const leave = Leave.reconstitute(state);

      expect(leave.id).toBe(state.id);
      expect(leave.employeeId).toBe(state.employeeId);
      expect(leave.leaveTypeId).toBe(state.leaveTypeId);
      expect(leave.startDate).toEqual(state.startDate);
      expect(leave.endDate).toEqual(state.endDate);
      expect(leave.totalDays).toBe(state.totalDays);
      expect(leave.reason).toBe(state.reason);
      expect(leave.status).toBe(state.status);
      expect(leave.approvedBy).toBe(state.approvedBy);
      expect(leave.approvedAt).toEqual(state.approvedAt);
      expect(leave.remarks).toBe(state.remarks);
      expect(leave.createdAt).toEqual(state.createdAt);
      expect(leave.updatedAt).toEqual(state.updatedAt);
    });
  });

  describe('approve', () => {
    it('should approve a PENDING leave and record LeaveApproved event', () => {
      const leave = Leave.create(validProps).getValue();
      leave.pullEvents();

      const result = leave.approve('mgr-001', 'Looks good');

      expect(result.isSuccess()).toBe(true);
      expect(leave.status).toBe('APPROVED');
      expect(leave.approvedBy).toBe('mgr-001');
      expect(leave.approvedAt).toBeDefined();
      expect(leave.remarks).toBe('Looks good');

      const events = leave.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.leave.approved');
    });

    it('should fail on non-PENDING leave', () => {
      const leave = Leave.create(validProps).getValue();
      leave.approve('mgr-001');

      const result = leave.approve('mgr-002');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_ALREADY_PROCESSED');
    });
  });

  describe('reject', () => {
    it('should reject a PENDING leave and record LeaveRejected event', () => {
      const leave = Leave.create(validProps).getValue();
      leave.pullEvents();

      const result = leave.reject('mgr-001', 'Not enough coverage');

      expect(result.isSuccess()).toBe(true);
      expect(leave.status).toBe('REJECTED');
      expect(leave.approvedBy).toBe('mgr-001');
      expect(leave.approvedAt).toBeDefined();

      const events = leave.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.leave.rejected');
    });

    it('should fail on non-PENDING leave', () => {
      const leave = Leave.create(validProps).getValue();
      leave.approve('mgr-001');

      const result = leave.reject('mgr-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_ALREADY_PROCESSED');
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING leave and record LeaveCancelled event', () => {
      const leave = Leave.create(validProps).getValue();
      leave.pullEvents();

      const result = leave.cancel();

      expect(result.isSuccess()).toBe(true);
      expect(leave.status).toBe('CANCELLED');
      expect(leave.cancelledAt).toBeDefined();

      const events = leave.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.leave.cancelled');
    });

    it('should cancel an APPROVED leave', () => {
      const leave = Leave.create(validProps).getValue();
      leave.approve('mgr-001');
      leave.pullEvents();

      const result = leave.cancel();

      expect(result.isSuccess()).toBe(true);
      expect(leave.status).toBe('CANCELLED');

      const events = leave.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.leave.cancelled');
    });

    it('should fail on REJECTED leave', () => {
      const leave = Leave.create(validProps).getValue();
      leave.reject('mgr-001');

      const result = leave.cancel();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_CANNOT_CANCEL');
    });

    it('should fail on already CANCELLED leave', () => {
      const leave = Leave.create(validProps).getValue();
      leave.cancel();

      const result = leave.cancel();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_CANNOT_CANCEL');
    });
  });
});
