import { inject, injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserState } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';

@injectable()
export class KyselyUserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('auth.users')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('auth.users')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row) : null;
  }

  async save(user: User, hashedPassword: string): Promise<void> {
    await this.db
      .insertInto('auth.users')
      .values({
        id: user.id,
        email: user.email.value,
        password_hash: hashedPassword,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .execute();
  }

  async update(user: User): Promise<void> {
    await this.db
      .updateTable('auth.users')
      .set({
        role: user.role,
        is_active: user.isActive,
        updated_at: user.updatedAt,
      })
      .where('id', '=', user.id)
      .execute();
  }

  private toEntity(row: any): User {
    return User.reconstitute({
      id: row.id,
      email: Email.create(row.email).getValue(),
      password: Password.fromHashed(row.password_hash),
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
