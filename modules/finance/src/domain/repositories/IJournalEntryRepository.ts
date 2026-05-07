import { JournalEntry } from '../entities/JournalEntry';
import { PaginatedResult } from '@erp/shared/kernel';

export type JournalEntryFilter = {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  accountId?: string;
};

export type PaginationInput = {
  page: number;
  limit: number;
};

export interface IJournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  findByEntryNumber(entryNumber: string): Promise<JournalEntry | null>;
  findAll(filter: JournalEntryFilter, pagination: PaginationInput): Promise<PaginatedResult<JournalEntry>>;
  save(entry: JournalEntry): Promise<void>;
  update(entry: JournalEntry): Promise<void>;
  getNextEntryNumber(): Promise<string>;
}
