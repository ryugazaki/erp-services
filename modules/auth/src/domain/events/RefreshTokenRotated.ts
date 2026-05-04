import { DomainEvent } from '@erp/shared/kernel';

export class RefreshTokenRotated extends DomainEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId: string,
  ) {
    super('auth.token.rotated');
  }
}
