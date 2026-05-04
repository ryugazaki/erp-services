import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User, hashedPassword: string): Promise<void>;
  update(user: User): Promise<void>;
}
