import { Email } from '../../../domain/value-objects/Email';

describe('Email', () => {
  it('should create a valid email', () => {
    const result = Email.create('user@test.com');
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe('user@test.com');
  });

  it('should fail on empty email', () => {
    const result = Email.create('');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMAIL_EMPTY');
  });

  it('should fail on whitespace-only email', () => {
    const result = Email.create('   ');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMAIL_EMPTY');
  });

  it('should fail on invalid format', () => {
    const result = Email.create('not-an-email');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMAIL_INVALID_FORMAT');
  });

  it('should normalize to lowercase', () => {
    const result = Email.create('USER@TEST.COM');
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe('user@test.com');
  });

  it('should trim whitespace', () => {
    const result = Email.create('  user@test.com  ');
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().value).toBe('user@test.com');
  });

  it('should compare equality correctly', () => {
    const a = Email.create('test@example.com').getValue();
    const b = Email.create('test@example.com').getValue();
    const c = Email.create('other@example.com').getValue();
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
