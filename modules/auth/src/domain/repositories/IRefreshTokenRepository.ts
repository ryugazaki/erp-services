import { RefreshToken } from '../entities/RefreshToken';

export interface IRefreshTokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  findByFamilyId(familyId: string): Promise<RefreshToken[]>;
  save(token: RefreshToken): Promise<void>;
  revokeAllInFamily(familyId: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
