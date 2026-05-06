import { Employee } from '../Employee';

describe('Employee Entity', () => {
  const validProps = {
    employeeNumber: 'EMP-00001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    departmentId: 'dept-123',
    position: 'Software Engineer',
    hireDate: new Date('2024-01-15'),
    userId: 'user-123',
  };

  describe('create', () => {
    it('should create an employee with valid props', () => {
      const result = Employee.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const employee = result.getValue();

      expect(employee.firstName).toBe('John');
      expect(employee.lastName).toBe('Doe');
      expect(employee.email).toBe('john.doe@example.com');
      expect(employee.phone).toBe('+1234567890');
      expect(employee.departmentId).toBe('dept-123');
      expect(employee.position).toBe('Software Engineer');
      expect(employee.hireDate).toEqual(new Date('2024-01-15'));
      expect(employee.status).toBe('ACTIVE');
      expect(employee.userId).toBe('user-123');
      expect(employee.id).toBeDefined();
      expect(employee.employeeNumber).toBe('EMP-00001');
      expect(employee.createdAt).toBeDefined();
      expect(employee.updatedAt).toBeDefined();

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.employee.created');
    });

    it('should fail with empty firstName', () => {
      const result = Employee.create({ ...validProps, firstName: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('FIRST_NAME_REQUIRED');
    });

    it('should fail with empty lastName', () => {
      const result = Employee.create({ ...validProps, lastName: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('LAST_NAME_REQUIRED');
    });

    it('should fail with no hireDate', () => {
      const result = Employee.create({ ...validProps, hireDate: undefined as any });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('HIRE_DATE_REQUIRED');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'emp-001',
        employeeNumber: 'EMP-001',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+9876543210',
        departmentId: 'dept-456',
        position: 'Manager',
        hireDate: new Date('2023-06-01'),
        status: 'ACTIVE',
        userId: 'user-456',
        createdAt: new Date('2023-06-01T00:00:00Z'),
        updatedAt: new Date('2023-06-01T00:00:00Z'),
      };

      const employee = Employee.reconstitute(state);

      expect(employee.id).toBe(state.id);
      expect(employee.employeeNumber).toBe(state.employeeNumber);
      expect(employee.firstName).toBe(state.firstName);
      expect(employee.lastName).toBe(state.lastName);
      expect(employee.email).toBe(state.email);
      expect(employee.phone).toBe(state.phone);
      expect(employee.departmentId).toBe(state.departmentId);
      expect(employee.position).toBe(state.position);
      expect(employee.hireDate).toEqual(state.hireDate);
      expect(employee.status).toBe(state.status);
      expect(employee.userId).toBe(state.userId);
      expect(employee.createdAt).toEqual(state.createdAt);
      expect(employee.updatedAt).toEqual(state.updatedAt);
    });
  });

  describe('updateDetails', () => {
    it('should change firstName, lastName, phone, departmentId, and position', () => {
      const employee = Employee.create(validProps).getValue();

      const result = employee.updateDetails({
        firstName: 'Robert',
        lastName: 'Johnson',
        phone: '+1111111111',
        departmentId: 'dept-789',
        position: 'Senior Engineer',
      });

      expect(result.isSuccess()).toBe(true);
      expect(employee.firstName).toBe('Robert');
      expect(employee.lastName).toBe('Johnson');
      expect(employee.phone).toBe('+1111111111');
      expect(employee.departmentId).toBe('dept-789');
      expect(employee.position).toBe('Senior Engineer');
    });

    it('should fail with empty firstName', () => {
      const employee = Employee.create(validProps).getValue();

      const result = employee.updateDetails({ firstName: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('FIRST_NAME_REQUIRED');
    });
  });

  describe('changeStatus', () => {
    it('should change status and record EmployeeStatusChanged event', () => {
      const employee = Employee.create(validProps).getValue();
      employee.pullEvents();

      const result = employee.changeStatus('INACTIVE');

      expect(result.isSuccess()).toBe(true);
      expect(employee.status).toBe('INACTIVE');

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hr.employee.status-changed');
    });
  });
});
