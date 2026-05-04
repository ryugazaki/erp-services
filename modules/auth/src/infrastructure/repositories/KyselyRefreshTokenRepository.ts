import { inject, injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '../../domain/entities/RefreshToken';

@injectable()
export class KyselyRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const row = await this.db
      .selectFrom('auth.refresh_tokens')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByFamilyId(familyId: string): Promise<RefreshToken[]> {
    const rows = await this.db
      .selectFrom('auth.refresh_tokens')
      .selectAll()
      .where('family_id', '=', familyId)
      .execute();

    return rows.map((row) => this.toEntity(row));
  }

  async save(token: RefreshToken): Promise<void> {
    await this.db
      .insertInto('auth.refresh_tokens')
      .values({
        id: token.id,
        user_id: token.userId,
        family_id: token.familyId,
        parent_token_id: token.parentTokenId,
        is_used: token.isUsed,
        is_revoked: token.isRevoked,
        expires_at: token.expiresAt,
        created_at: new Date(),
      })
      .onConflict((oc) => oc.column('id').doUpdateSet({
        is_used: (eb: any) => eb.ref('excluded.is_used'),
        is_revoked: (eb: any) => eb.ref('excluded.is_revoked'),
      }))
      .execute();
  }

  async revokeAllInFamily(familyId: string): Promise<void> {
    await this.db
      .updateTable('auth.refresh_tokens')
      .set({ is_revoked: true })
      .where('family_id', '=', familyId)
      .execute();
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db
      .updateTable('auth.refresh_tokens')
      .set({ is_revoked: true })
      .where('user_id', '=', userId)
      .execute();
  }

  private toEntity(row: any): RefreshToken {
    return RefreshToken.reconstitute({
      id: row.id,
      userId: row.user_id,
      familyId: row.family_id,
      parentTokenId: row.parent_token_id,
      isUsed: row.is_used,
      isRevoked: row.is_revoked,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    });
  }
}
