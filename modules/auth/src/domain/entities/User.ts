import { AggregateRoot, Result } from '@erp/shared/kernel';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';
import { UserCreated } from '../events/UserCreated';
import { UserDeactivated } from '../events/UserDeactivated';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'GUEST';

interface CreateUserProps {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserState {
  id: string;
  email: Email;
  password: Password;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private constructor(private state: UserState) {
    super();
  }

  get id(): string { return this.state.id; }
  get email(): Email { return this.state.email; }
  get password(): Password { return this.state.password; }
  get role(): UserRole { return this.state.role; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateUserProps): Result<User> {
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure()) return Result.fail(emailResult.getError());

    const passwordResult = Password.create(props.password);
    if (passwordResult.isFailure()) return Result.fail(passwordResult.getError());

    const now = new Date();
    const user = new User({
      id: crypto.randomUUID(),
      email: emailResult.getValue(),
      password: passwordResult.getValue(),
      role: props.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    user.recordEvent(new UserCreated(user.id, user.email.value, user.role));

    return Result.ok(user);
  }

  static reconstitute(state: UserState): User {
    return new User(state);
  }

  deactivate(): Result<void> {
    if (!this.state.isActive) {
      return Result.fail('USER_ALREADY_INACTIVE');
    }

    this.state.isActive = false;
    this.state.updatedAt = new Date();
    this.recordEvent(new UserDeactivated(this.id, this.email.value));

    return Result.ok(undefined);
  }

  changeRole(newRole: UserRole): Result<void> {
    if (this.state.role === newRole) {
      return Result.fail('ROLE_UNCHANGED');
    }

    this.state.role = newRole;
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
