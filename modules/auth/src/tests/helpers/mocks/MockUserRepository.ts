import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

export class MockUserRepository implements IUserRepository {
  private user: User | null = null;
  private saved: User | null = null;
  private savedHash: string | null = null;

  setUser(user: User | null) { this.user = user; }
  getSaved() { return { user: this.saved, hash: this.savedHash }; }

  async findById(_id: string) { return this.user; }
  async findByEmail(_email: string) { return this.user; }
  async save(user: User, hash: string) { this.saved = user; this.savedHash = hash; }
  async update(user: User) { this.saved = user; }
}
