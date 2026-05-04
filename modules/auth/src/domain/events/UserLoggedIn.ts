import { DomainEvent } from '@erp/shared/kernel';

export class UserLoggedIn extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super('auth.user.logged_in');
  }
}
