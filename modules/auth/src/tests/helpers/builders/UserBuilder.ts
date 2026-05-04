import { User, UserRole } from '../../../domain/entities/User';

export class UserBuilder {
  private props = {
    email: 'user@test.com',
    password: 'MyP@ssw0rd!',
    role: 'EMPLOYEE' as UserRole,
  };

  withEmail(email: string) { this.props.email = email; return this; }
  withPassword(pw: string) { this.props.password = pw; return this; }
  withRole(role: UserRole) { this.props.role = role; return this; }

  build(): User {
    return User.create(this.props).getValue();
  }

  async buildWithHashedPassword(): Promise<{ user: User; hash: string }> {
    const user = this.build();
    const hash = await user.password.hash();
    return { user, hash };
  }
}
