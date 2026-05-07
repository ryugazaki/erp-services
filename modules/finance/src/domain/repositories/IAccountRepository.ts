import { Account } from '../entities/Account';
import { PaginatedResult } from '@erp/shared/kernel';

export type AccountFilter = {
  type?: string;
  isActive?: boolean;
  search?: string;
};

export type PaginationInput = {
  page: number;
  limit: number;
};

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findAll(filter: AccountFilter, pagination: PaginationInput): Promise<PaginatedResult<Account>>;
  findChildren(parentId: string): Promise<Account[]>;
  findRootAccounts(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  update(account: Account): Promise<void>;
  hasJournalEntries(accountId: string): Promise<boolean>;
}
