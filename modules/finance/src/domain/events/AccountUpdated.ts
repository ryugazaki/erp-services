import { DomainEvent } from '@erp/shared/kernel';

export class AccountUpdated extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
  ) {
    super('finance.account.updated');
  }
}
