import crypto from 'crypto';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

function generatePassword(length: number): string {
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CHARS[v % CHARS.length]).join('');
}

export interface IUserAccountCreator {
  createAccount(email: string, role: string): Promise<{ userId: string; temporaryPassword: string }>;
}

export class UserAccountCreator implements IUserAccountCreator {
  constructor(private readonly userRepo: IUserRepository) {}

  async createAccount(email: string, role: string): Promise<{ userId: string; temporaryPassword: string }> {
    const temporaryPassword = generatePassword(16);

    const userResult = User.create({ email, password: temporaryPassword, role: role as any });
    if (userResult.isFailure()) throw new Error(userResult.getError());

    const user = userResult.getValue();

    const hashedPassword = await user.password.hash();
    await this.userRepo.save(user, hashedPassword);

    return { userId: user.id, temporaryPassword };
  }
}
