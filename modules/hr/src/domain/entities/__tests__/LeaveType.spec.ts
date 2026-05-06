import { LeaveType } from '../LeaveType';

describe('LeaveType Entity', () => {
  const validProps = {
    name: 'Annual Leave',
    code: 'ANNUAL',
    description: 'Yearly vacation leave',
    defaultDays: 12,
    isPaid: true,
  };

  describe('create', () => {
    it('should create a leave type with valid props', () => {
      const result = LeaveType.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const leaveType = result.getValue();

      expect(leaveType.name).toBe('Annual Leave');
      expect(leaveType.code).toBe('ANNUAL');
      expect(leaveType.description).toBe('Yearly vacation leave');
      expect(leaveType.defaultDays).toBe(12);
      expect(leaveType.isActive).toBe(true);
      expect(leaveType.isPaid).toBe(true);
      expect(leaveType.id).toBeDefined();
    });

    it('should default isPaid to true when not provided', () => {
      const { isPaid, ...propsWithoutIsPaid } = validProps;
      const result = LeaveType.create(propsWithoutIsPaid as any);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().isPaid).toBe(true);
    });

    it('should fail with empty name', () => {
      const result = LeaveType.create({ ...validProps, name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_TYPE_NAME_REQUIRED');
    });

    it('should fail with empty code', () => {
      const result = LeaveType.create({ ...validProps, code: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_TYPE_CODE_REQUIRED');
    });

    it('should fail with negative defaultDays', () => {
      const result = LeaveType.create({ ...validProps, defaultDays: -1 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_TYPE_INVALID_DAYS');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'lt-001',
        name: 'Sick Leave',
        code: 'SICK',
        description: 'Medical leave',
        defaultDays: 10,
        isPaid: false,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const leaveType = LeaveType.reconstitute(state);

      expect(leaveType.id).toBe(state.id);
      expect(leaveType.name).toBe(state.name);
      expect(leaveType.code).toBe(state.code);
      expect(leaveType.description).toBe(state.description);
      expect(leaveType.defaultDays).toBe(state.defaultDays);
      expect(leaveType.isPaid).toBe(state.isPaid);
      expect(leaveType.isActive).toBe(state.isActive);
      expect(leaveType.createdAt).toEqual(state.createdAt);
      expect(leaveType.updatedAt).toEqual(state.updatedAt);
    });
  });

  describe('update', () => {
    it('should change name, description, defaultDays, isPaid, and isActive', () => {
      const leaveType = LeaveType.create(validProps).getValue();

      const result = leaveType.update({
        name: 'Updated Leave',
        description: 'Updated description',
        defaultDays: 15,
        isPaid: false,
        isActive: false,
      });

      expect(result.isSuccess()).toBe(true);
      expect(leaveType.name).toBe('Updated Leave');
      expect(leaveType.description).toBe('Updated description');
      expect(leaveType.defaultDays).toBe(15);
      expect(leaveType.isPaid).toBe(false);
      expect(leaveType.isActive).toBe(false);
    });

    it('should fail with empty name', () => {
      const leaveType = LeaveType.create(validProps).getValue();

      const result = leaveType.update({ name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_TYPE_NAME_REQUIRED');
    });

    it('should fail with negative defaultDays', () => {
      const leaveType = LeaveType.create(validProps).getValue();

      const result = leaveType.update({ defaultDays: -5 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LEAVE_TYPE_INVALID_DAYS');
    });
  });
});
