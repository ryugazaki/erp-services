import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '../../../domain/entities/RefreshToken';

export class MockRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens = new Map<string, RefreshToken>();
  public revokedFamilies: string[] = [];
  public revokedUsers: string[] = [];

  setToken(token: RefreshToken) { this.tokens.set(token.id, token); }

  async findById(id: string) { return this.tokens.get(id) ?? null; }
  async findByFamilyId(familyId: string) {
    return Array.from(this.tokens.values()).filter(t => t.familyId === familyId);
  }
  async save(token: RefreshToken) { this.tokens.set(token.id, token); }
  async revokeAllInFamily(familyId: string) {
    this.revokedFamilies.push(familyId);
    for (const token of this.tokens.values()) {
      if (token.familyId === familyId) token.revoke();
    }
  }
  async revokeAllByUserId(userId: string) {
    this.revokedUsers.push(userId);
    for (const token of this.tokens.values()) {
      if (token.userId === userId) token.revoke();
    }
  }
}
