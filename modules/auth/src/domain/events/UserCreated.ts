import { DomainEvent } from '@erp/shared/kernel';

export class UserCreated extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
  ) {
    super('auth.user.created');
  }
}
