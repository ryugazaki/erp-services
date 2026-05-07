import { Account } from '../Account';

describe('Account Entity', () => {
  const validProps = {
    code: '1-1001',
    name: 'Cash',
    description: 'Primary cash account',
    type: 'ASSET',
  };

  describe('create', () => {
    it('should create an account with valid props', () => {
      const result = Account.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const account = result.getValue();

      expect(account.code).toBe('1-1001');
      expect(account.name).toBe('Cash');
      expect(account.description).toBe('Primary cash account');
      expect(account.type).toBe('ASSET');
      expect(account.isActive).toBe(true);
      expect(account.isSystemAccount).toBe(false);
      expect(account.parentId).toBeNull();
      expect(account.id).toBeDefined();
      expect(account.createdAt).toBeDefined();
      expect(account.updatedAt).toBeDefined();

      const events = account.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.account.created');
    });

    it('should create with parent ID', () => {
      const result = Account.create({ ...validProps, parentId: 'parent-123' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().parentId).toBe('parent-123');
    });

    it('should fail with invalid account code', () => {
      const result = Account.create({ ...validProps, code: 'INVALID' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('INVALID_ACCOUNT_CODE');
    });

    it('should fail with invalid account type', () => {
      const result = Account.create({ ...validProps, type: 'INVALID' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('INVALID_ACCOUNT_TYPE');
    });

    it('should fail with empty name', () => {
      const result = Account.create({ ...validProps, name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_NAME_REQUIRED');
    });

    it('should fail with whitespace name', () => {
      const result = Account.create({ ...validProps, name: '   ' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_NAME_REQUIRED');
    });

    it('should trim name', () => {
      const result = Account.create({ ...validProps, name: '  Cash  ' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().name).toBe('Cash');
    });

    it('should trim description', () => {
      const result = Account.create({ ...validProps, description: '  Description  ' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().description).toBe('Description');
    });

    it('should handle null description', () => {
      const props = { ...validProps };
      delete (props as any).description;

      const result = Account.create(props);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().description).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'acc-001',
        code: '1-1001',
        name: 'Cash',
        description: 'Primary cash account',
        type: 'ASSET',
        parentId: 'parent-123',
        isActive: true,
        isSystemAccount: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const account = Account.reconstitute(state);

      expect(account.id).toBe(state.id);
      expect(account.code).toBe(state.code);
      expect(account.name).toBe(state.name);
      expect(account.description).toBe(state.description);
      expect(account.type).toBe(state.type);
      expect(account.parentId).toBe(state.parentId);
      expect(account.isActive).toBe(state.isActive);
      expect(account.isSystemAccount).toBe(state.isSystemAccount);
      expect(account.createdAt).toEqual(state.createdAt);
      expect(account.updatedAt).toEqual(state.updatedAt);
    });

    it('should not generate events on reconstitution', () => {
      const state = {
        id: 'acc-001',
        code: '1-1001',
        name: 'Cash',
        description: null,
        type: 'ASSET',
        parentId: null,
        isActive: true,
        isSystemAccount: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const account = Account.reconstitute(state);
      const events = account.pullEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('updateDetails', () => {
    it('should update name', () => {
      const account = Account.create(validProps).getValue();
      account.pullEvents();

      const result = account.updateDetails({ name: 'Petty Cash' });

      expect(result.isSuccess()).toBe(true);
      expect(account.name).toBe('Petty Cash');
      expect(account.updatedAt).toBeDefined();

      const events = account.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.account.updated');
    });

    it('should update description', () => {
      const account = Account.create(validProps).getValue();
      account.pullEvents();

      const result = account.updateDetails({ description: 'Updated description' });

      expect(result.isSuccess()).toBe(true);
      expect(account.description).toBe('Updated description');
    });

    it('should update both name and description', () => {
      const account = Account.create(validProps).getValue();
      account.pullEvents();

      const result = account.updateDetails({
        name: 'New Name',
        description: 'New Description',
      });

      expect(result.isSuccess()).toBe(true);
      expect(account.name).toBe('New Name');
      expect(account.description).toBe('New Description');
    });

    it('should fail for system account', () => {
      const state = {
        id: 'acc-001',
        code: '1-1001',
        name: 'Cash',
        description: null,
        type: 'ASSET',
        parentId: null,
        isActive: true,
        isSystemAccount: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      const account = Account.reconstitute(state);

      const result = account.updateDetails({ name: 'New Name' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_IS_SYSTEM');
    });

    it('should fail with empty name', () => {
      const account = Account.create(validProps).getValue();

      const result = account.updateDetails({ name: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_NAME_REQUIRED');
    });
  });

  describe('deactivate', () => {
    it('should deactivate account', () => {
      const account = Account.create(validProps).getValue();
      account.pullEvents();

      const result = account.deactivate(false);

      expect(result.isSuccess()).toBe(true);
      expect(account.isActive).toBe(false);

      const events = account.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.account.deactivated');
    });

    it('should fail for system account', () => {
      const state = {
        id: 'acc-001',
        code: '1-1001',
        name: 'Cash',
        description: null,
        type: 'ASSET',
        parentId: null,
        isActive: true,
        isSystemAccount: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      const account = Account.reconstitute(state);

      const result = account.deactivate(false);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_IS_SYSTEM');
    });

    it('should fail if already inactive', () => {
      const account = Account.create(validProps).getValue();
      account.deactivate(false);

      const result = account.deactivate(false);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_ALREADY_INACTIVE');
    });

    it('should fail if has journal entries', () => {
      const account = Account.create(validProps).getValue();

      const result = account.deactivate(true);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('ACCOUNT_HAS_JOURNAL_ENTRIES');
    });
  });

  describe('getTypeValue', () => {
    it('should return AccountType value object', () => {
      const account = Account.create(validProps).getValue();
      const type = account.getTypeValue();

      expect(type.getValue()).toBe('ASSET');
    });
  });

  describe('getCodeValue', () => {
    it('should return AccountCode value object', () => {
      const account = Account.create(validProps).getValue();
      const code = account.getCodeValue();

      expect(code.getValue()).toBe('1-1001');
    });
  });
});
