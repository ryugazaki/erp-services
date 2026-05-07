import { DomainEvent } from '@erp/shared/kernel';

export class AccountDeactivated extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
  ) {
    super('finance.account.deactivated');
  }
}
