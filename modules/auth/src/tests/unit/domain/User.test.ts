import { User, UserRole } from '../../../domain/entities/User';

describe('User', () => {
  const validProps = {
    email: 'user@test.com',
    password: 'MyP@ssw0rd!',
    role: 'EMPLOYEE' as UserRole,
  };

  it('should create a user with valid props', () => {
    const result = User.create(validProps);
    expect(result.isSuccess()).toBe(true);
    const user = result.getValue();
    expect(user.email.value).toBe('user@test.com');
    expect(user.role).toBe('EMPLOYEE');
    expect(user.isActive).toBe(true);
  });

  it('should fail with invalid email', () => {
    const result = User.create({ ...validProps, email: 'bad' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMAIL_INVALID_FORMAT');
  });

  it('should fail with weak password', () => {
    const result = User.create({ ...validProps, password: 'weak' });
    expect(result.isFailure()).toBe(true);
  });

  it('should record UserCreated event on create', () => {
    const user = User.create(validProps).getValue();
    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('auth.user.created');
  });

  it('should deactivate an active user', () => {
    const user = User.create(validProps).getValue();
    user.pullEvents(); // clear UserCreated
    const result = user.deactivate();
    expect(result.isSuccess()).toBe(true);
    expect(user.isActive).toBe(false);
  });

  it('should fail to deactivate already inactive user', () => {
    const user = User.create(validProps).getValue();
    user.deactivate();
    const result = user.deactivate();
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('USER_ALREADY_INACTIVE');
  });

  it('should record UserDeactivated event', () => {
    const user = User.create(validProps).getValue();
    user.pullEvents();
    user.deactivate();
    const events = user.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('auth.user.deactivated');
  });

  it('should change role successfully', () => {
    const user = User.create(validProps).getValue();
    const result = user.changeRole('MANAGER');
    expect(result.isSuccess()).toBe(true);
    expect(user.role).toBe('MANAGER');
  });

  it('should fail to change to same role', () => {
    const user = User.create(validProps).getValue();
    const result = user.changeRole('EMPLOYEE');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ROLE_UNCHANGED');
  });

  it('reconstitute should not trigger events', () => {
    const user = User.reconstitute({
      id: 'test-id',
      email: { value: 'test@test.com', equals: () => false, toString: () => 'test@test.com' } as any,
      password: {} as any,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const events = user.pullEvents();
    expect(events).toHaveLength(0);
  });
});
