import { DomainEvent } from '@erp/shared/kernel';

export class AccountCreated extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: string,
  ) {
    super('finance.account.created');
  }
}
