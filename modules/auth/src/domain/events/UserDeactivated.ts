import { DomainEvent } from '@erp/shared/kernel';

export class UserDeactivated extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super('auth.user.deactivated');
  }
}
