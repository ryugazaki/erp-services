import { Password } from '../../../domain/value-objects/Password';

describe('Password', () => {
  it('should create a valid password', () => {
    const result = Password.create('MyP@ssw0rd!');
    expect(result.isSuccess()).toBe(true);
  });

  it('should fail on too short password', () => {
    const result = Password.create('Ab1!');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('PASSWORD_TOO_SHORT');
  });

  it('should fail on missing uppercase', () => {
    const result = Password.create('myp@ssw0rd!');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('PASSWORD_TOO_WEAK');
  });

  it('should fail on missing number', () => {
    const result = Password.create('MyP@ssword!');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('PASSWORD_TOO_WEAK');
  });

  it('should fail on missing special character', () => {
    const result = Password.create('MyPassw0rd');
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('PASSWORD_TOO_WEAK');
  });

  it('should hash a raw password', async () => {
    const password = Password.create('MyP@ssw0rd!').getValue();
    const hash = await password.hash();
    expect(hash).not.toBe('MyP@ssw0rd!');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('should not re-hash an already hashed password', async () => {
    const password = Password.create('MyP@ssw0rd!').getValue();
    const hash1 = await password.hash();
    const hashed = Password.fromHashed(hash1);
    const hash2 = await hashed.hash();
    expect(hash1).toBe(hash2);
  });

  it('should compare password correctly', async () => {
    const password = Password.create('MyP@ssw0rd!').getValue();
    const hash = await password.hash();
    const hashed = Password.fromHashed(hash);
    expect(await hashed.compare('MyP@ssw0rd!')).toBe(true);
    expect(await hashed.compare('WrongP@ss1!')).toBe(false);
  });

  it('should throw when comparing on unhashed password', async () => {
    const password = Password.create('MyP@ssw0rd!').getValue();
    await expect(password.compare('test')).rejects.toThrow('Cannot compare against an unhashed password');
  });

  it('fromHashed should bypass validation', () => {
    const hashed = Password.fromHashed('$2b$12$somehash');
    expect(hashed).toBeDefined();
  });
});
