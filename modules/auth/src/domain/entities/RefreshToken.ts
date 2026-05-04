import { AggregateRoot, Result } from '@erp/shared/kernel';
import { RefreshTokenRotated } from '../events/RefreshTokenRotated';

const REFRESH_TOKEN_TTL_DAYS = 7;

export interface RefreshTokenState {
  id: string;
  userId: string;
  familyId: string;
  parentTokenId: string | null;
  isUsed: boolean;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export class RefreshToken extends AggregateRoot {
  private constructor(private state: RefreshTokenState) {
    super();
  }

  get id(): string { return this.state.id; }
  get userId(): string { return this.state.userId; }
  get familyId(): string { return this.state.familyId; }
  get parentTokenId(): string | null { return this.state.parentTokenId; }
  get isUsed(): boolean { return this.state.isUsed; }
  get isRevoked(): boolean { return this.state.isRevoked; }
  get expiresAt(): Date { return this.state.expiresAt; }

  static create(userId: string): RefreshToken {
    return new RefreshToken({
      id: crypto.randomUUID(),
      userId,
      familyId: crypto.randomUUID(),
      parentTokenId: null,
      isUsed: false,
      isRevoked: false,
      expiresAt: RefreshToken.ttlFromNow(),
      createdAt: new Date(),
    });
  }

  static createChild(parent: RefreshToken): RefreshToken {
    return new RefreshToken({
      id: crypto.randomUUID(),
      userId: parent.userId,
      familyId: parent.familyId,
      parentTokenId: parent.id,
      isUsed: false,
      isRevoked: false,
      expiresAt: RefreshToken.ttlFromNow(),
      createdAt: new Date(),
    });
  }

  static reconstitute(state: RefreshTokenState): RefreshToken {
    return new RefreshToken(state);
  }

  use(): Result<void> {
    if (this.state.isRevoked) return Result.fail('TOKEN_REVOKED');
    if (this.state.isUsed) return Result.fail('TOKEN_ALREADY_USED');
    if (this.isExpired()) return Result.fail('TOKEN_EXPIRED');

    this.state.isUsed = true;
    this.recordEvent(new RefreshTokenRotated(this.id, this.userId));

    return Result.ok(undefined);
  }

  revoke(): void {
    this.state.isRevoked = true;
  }

  isReuse(): boolean {
    return this.state.isUsed && !this.state.isRevoked;
  }

  private isExpired(): boolean {
    return new Date() > this.state.expiresAt;
  }

  private static ttlFromNow(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  }
}
