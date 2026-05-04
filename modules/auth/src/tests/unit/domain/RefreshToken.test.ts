import { RefreshToken } from '../../../domain/entities/RefreshToken';

describe('RefreshToken', () => {
  it('should create a new token with new familyId', () => {
    const token = RefreshToken.create('user-1');
    expect(token.userId).toBe('user-1');
    expect(token.familyId).toBeDefined();
    expect(token.parentTokenId).toBeNull();
    expect(token.isUsed).toBe(false);
    expect(token.isRevoked).toBe(false);
  });

  it('should create child token inheriting familyId', () => {
    const parent = RefreshToken.create('user-1');
    const child = RefreshToken.createChild(parent);
    expect(child.familyId).toBe(parent.familyId);
    expect(child.parentTokenId).toBe(parent.id);
    expect(child.userId).toBe(parent.userId);
  });

  it('should mark token as used', () => {
    const token = RefreshToken.create('user-1');
    const result = token.use();
    expect(result.isSuccess()).toBe(true);
    expect(token.isUsed).toBe(true);
  });

  it('should fail to use a revoked token', () => {
    const token = RefreshToken.create('user-1');
    token.revoke();
    const result = token.use();
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('TOKEN_REVOKED');
  });

  it('should fail to use an already used token', () => {
    const token = RefreshToken.create('user-1');
    token.use();
    const result = token.use();
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('TOKEN_ALREADY_USED');
  });

  it('should revoke a token', () => {
    const token = RefreshToken.create('user-1');
    token.revoke();
    expect(token.isRevoked).toBe(true);
  });

  it('isReuse should detect used but not revoked token', () => {
    const token = RefreshToken.create('user-1');
    expect(token.isReuse()).toBe(false);
    token.use();
    expect(token.isReuse()).toBe(true);
  });

  it('isReuse should return false for revoked token', () => {
    const token = RefreshToken.create('user-1');
    token.use();
    token.revoke();
    expect(token.isReuse()).toBe(false);
  });

  it('reconstitute should not trigger events', () => {
    const token = RefreshToken.reconstitute({
      id: 't1',
      userId: 'u1',
      familyId: 'f1',
      parentTokenId: null,
      isUsed: false,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    });
    expect(token.pullEvents()).toHaveLength(0);
  });
});
