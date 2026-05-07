import { Account } from '../../domain/entities/Account';
import type { IAccountRepository, AccountFilter, PaginationInput } from '../../domain/repositories/IAccountRepository';
import { PaginatedResult } from '@erp/shared/kernel';

export class MockAccountRepository implements IAccountRepository {
  private accounts: Map<string, Account> = new Map();

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null;
  }

  async findByCode(code: string): Promise<Account | null> {
    for (const account of this.accounts.values()) {
      if (account.code === code) return account;
    }
    return null;
  }

  async findAll(filter: AccountFilter, pagination: PaginationInput): Promise<PaginatedResult<Account>> {
    let items = Array.from(this.accounts.values());

    if (filter.type) {
      items = items.filter((a) => a.type === filter.type);
    }

    if (filter.isActive !== undefined) {
      items = items.filter((a) => a.isActive === filter.isActive);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.code.toLowerCase().includes(search),
      );
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paged = items.slice(start, start + pagination.limit);

    return {
      items: paged,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  async findChildren(parentId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter((a) => a.parentId === parentId);
  }

  async findRootAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter((a) => a.parentId === null);
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.id, account);
  }

  async update(account: Account): Promise<void> {
    this.accounts.set(account.id, account);
  }

  async hasJournalEntries(_accountId: string): Promise<boolean> {
    return false;
  }

  clear(): void {
    this.accounts.clear();
  }
}
