import { DomainEvent } from '@erp/shared/kernel';

export class TokenFamilyCompromised extends DomainEvent {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {
    super('auth.token-family.compromised');
  }
}
