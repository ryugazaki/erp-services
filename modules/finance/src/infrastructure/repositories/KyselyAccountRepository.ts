import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IAccountRepository, type AccountFilter, type PaginationInput } from '../../domain/repositories/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

interface DatabaseAccount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  parent_id: string | null;
  is_active: boolean;
  is_system_account: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@injectable()
export class KyselyAccountRepository implements IAccountRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<Account | null> {
    const row = await this.db
      .selectFrom('finance.accounts')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row as DatabaseAccount) : null;
  }

  async findByCode(code: string): Promise<Account | null> {
    const row = await this.db
      .selectFrom('finance.accounts')
      .selectAll()
      .where('code', '=', code)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? this.toEntity(row as DatabaseAccount) : null;
  }

  async findAll(filter: AccountFilter, pagination: PaginationInput): Promise<PaginatedResult<Account>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('finance.accounts')
      .selectAll()
      .where('deleted_at', 'is', null);

    if (filter.type) {
      query = query.where('type', '=', filter.type);
    }

    if (filter.isActive !== undefined) {
      query = query.where('is_active', '=', filter.isActive);
    }

    if (filter.search) {
      const search = filter.search;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('code', 'ilike', `%${search}%`),
          eb('description', 'ilike', `%${search}%`),
        ])
      );
    }

    // Count query
    let countQuery = this.db
      .selectFrom('finance.accounts')
      .select(this.db.fn.countAll().as('count'))
      .where('deleted_at', 'is', null);

    if (filter.type) {
      countQuery = countQuery.where('type', '=', filter.type);
    }

    if (filter.isActive !== undefined) {
      countQuery = countQuery.where('is_active', '=', filter.isActive);
    }

    if (filter.search) {
      const search = filter.search;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('code', 'ilike', `%${search}%`),
          eb('description', 'ilike', `%${search}%`),
        ])
      );
    }

    const [{ count }] = await countQuery.execute();
    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('code', 'asc')
      .offset((page - 1) * limit)
      .limit(limit)
      .execute();

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items: rows.map((row) => this.toEntity(row as DatabaseAccount)),
      meta,
    };
  }

  async findChildren(parentId: string): Promise<Account[]> {
    const rows = await this.db
      .selectFrom('finance.accounts')
      .selectAll()
      .where('parent_id', '=', parentId)
      .where('deleted_at', 'is', null)
      .orderBy('code', 'asc')
      .execute();

    return rows.map((row) => this.toEntity(row as DatabaseAccount));
  }

  async findRootAccounts(): Promise<Account[]> {
    const rows = await this.db
      .selectFrom('finance.accounts')
      .selectAll()
      .where('parent_id', 'is', null)
      .where('deleted_at', 'is', null)
      .orderBy('code', 'asc')
      .execute();

    return rows.map((row) => this.toEntity(row as DatabaseAccount));
  }

  async save(account: Account): Promise<void> {
    await this.db
      .insertInto('finance.accounts')
      .values({
        id: account.id,
        code: account.code,
        name: account.name,
        description: account.description,
        type: account.type,
        parent_id: account.parentId,
        is_active: account.isActive,
        is_system_account: account.isSystemAccount,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
      })
      .execute();
  }

  async update(account: Account): Promise<void> {
    await this.db
      .updateTable('finance.accounts')
      .set({
        code: account.code,
        name: account.name,
        description: account.description,
        type: account.type,
        parent_id: account.parentId,
        is_active: account.isActive,
        is_system_account: account.isSystemAccount,
        updated_at: account.updatedAt,
      })
      .where('id', '=', account.id)
      .execute();
  }

  async hasJournalEntries(accountId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('finance.journal_line_items')
      .select(this.db.fn.countAll().as('count'))
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return result ? Number(result.count) > 0 : false;
  }

  private toEntity(row: DatabaseAccount): Account {
    return Account.reconstitute({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      parentId: row.parent_id,
      isActive: row.is_active,
      isSystemAccount: row.is_system_account,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
