import bcrypt from 'bcrypt';
import { Result } from '@erp/shared/kernel';

const SALT_ROUNDS = 12;

export class Password {
  private constructor(
    private readonly _value: string,
    private readonly _isHashed: boolean,
  ) {}

  static create(raw: string): Result<Password> {
    if (!raw || raw.length < 8) {
      return Result.fail('PASSWORD_TOO_SHORT');
    }

    const hasUppercase = /[A-Z]/.test(raw);
    const hasNumber = /[0-9]/.test(raw);
    const hasSpecial = /[^A-Za-z0-9]/.test(raw);

    if (!hasUppercase || !hasNumber || !hasSpecial) {
      return Result.fail('PASSWORD_TOO_WEAK');
    }

    return Result.ok(new Password(raw, false));
  }

  static fromHashed(hashed: string): Password {
    return new Password(hashed, true);
  }

  async hash(): Promise<string> {
    if (this._isHashed) return this._value;
    return bcrypt.hash(this._value, SALT_ROUNDS);
  }

  async compare(raw: string): Promise<boolean> {
    if (!this._isHashed) {
      throw new Error('Cannot compare against an unhashed password');
    }
    return bcrypt.compare(raw, this._value);
  }
}
