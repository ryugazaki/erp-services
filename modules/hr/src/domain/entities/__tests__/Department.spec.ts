import { Department } from '../Department';

describe('Department Entity', () => {
  const validProps = {
    name: 'Engineering',
    code: 'ENG',
    description: 'Engineering department',
  };

  describe('create', () => {
    it('should create a department with valid props', () => {
      const result = Department.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const dept = result.getValue();

      expect(dept.name).toBe('Engineering');
      expect(dept.code).toBe('ENG');
      expect(dept.description).toBe('Engineering department');
      expect(dept.headId).toBeNull();
      expect(dept.isActive).toBe(true);
      expect(dept.id).toBeDefined();
      expect(dept.createdAt).toBeDefined();
      expect(dept.updatedAt).toBeDefined();

      const events = dept.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.department.created');
    });

    it('should create with headId', () => {
      const result = Department.create({ ...validProps, headId: 'emp-123' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().headId).toBe('emp-123');
    });

    it('should uppercase code', () => {
      const result = Department.create({ ...validProps, code: 'eng' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().code).toBe('ENG');
    });

    it('should fail with empty name', () => {
      const result = Department.create({ ...validProps, name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('DEPARTMENT_NAME_REQUIRED');
    });

    it('should fail with empty code', () => {
      const result = Department.create({ ...validProps, code: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('DEPARTMENT_CODE_REQUIRED');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'dept-001',
        name: 'Engineering',
        code: 'ENG',
        description: 'Engineering dept',
        headId: 'emp-001',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const dept = Department.reconstitute(state);

      expect(dept.id).toBe(state.id);
      expect(dept.name).toBe(state.name);
      expect(dept.code).toBe(state.code);
      expect(dept.description).toBe(state.description);
      expect(dept.headId).toBe(state.headId);
      expect(dept.isActive).toBe(state.isActive);
      expect(dept.createdAt).toEqual(state.createdAt);
      expect(dept.updatedAt).toEqual(state.updatedAt);
    });
  });

  describe('updateDetails', () => {
    it('should change name, description, and headId', () => {
      const dept = Department.create(validProps).getValue();

      const result = dept.updateDetails({
        name: 'Engineering & QA',
        description: 'Updated desc',
        headId: 'emp-456',
      });

      expect(result.isSuccess()).toBe(true);
      expect(dept.name).toBe('Engineering & QA');
      expect(dept.description).toBe('Updated desc');
      expect(dept.headId).toBe('emp-456');
    });

    it('should fail with empty name', () => {
      const dept = Department.create(validProps).getValue();

      const result = dept.updateDetails({ name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('DEPARTMENT_NAME_REQUIRED');
    });

    it('should set headId to null', () => {
      const dept = Department.create({ ...validProps, headId: 'emp-123' }).getValue();

      dept.updateDetails({ headId: null });

      expect(dept.headId).toBeNull();
    });
  });

  describe('deactivate / activate', () => {
    it('should deactivate an active department', () => {
      const dept = Department.create(validProps).getValue();

      const result = dept.deactivate();

      expect(result.isSuccess()).toBe(true);
      expect(dept.isActive).toBe(false);
    });

    it('should fail to deactivate an already inactive department', () => {
      const dept = Department.create(validProps).getValue();
      dept.deactivate();

      const result = dept.deactivate();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('DEPARTMENT_ALREADY_INACTIVE');
    });

    it('should activate an inactive department', () => {
      const dept = Department.create(validProps).getValue();
      dept.deactivate();

      const result = dept.activate();

      expect(result.isSuccess()).toBe(true);
      expect(dept.isActive).toBe(true);
    });

    it('should fail to activate an already active department', () => {
      const dept = Department.create(validProps).getValue();

      const result = dept.activate();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('DEPARTMENT_ALREADY_ACTIVE');
    });
  });
});
