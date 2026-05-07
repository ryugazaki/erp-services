import { JournalEntry } from '../../domain/entities/JournalEntry';
import type { IJournalEntryRepository, JournalEntryFilter, PaginationInput } from '../../domain/repositories/IJournalEntryRepository';
import { PaginatedResult } from '@erp/shared/kernel';

export class MockJournalEntryRepository implements IJournalEntryRepository {
  private entries: Map<string, JournalEntry> = new Map();
  private entryCounter = 0;

  async findById(id: string): Promise<JournalEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async findByEntryNumber(entryNumber: string): Promise<JournalEntry | null> {
    for (const entry of this.entries.values()) {
      if (entry.entryNumber === entryNumber) return entry;
    }
    return null;
  }

  async findAll(filter: JournalEntryFilter, pagination: PaginationInput): Promise<PaginatedResult<JournalEntry>> {
    let items = Array.from(this.entries.values());

    if (filter.status) {
      items = items.filter((e) => e.status === filter.status);
    }

    if (filter.dateFrom) {
      items = items.filter((e) => e.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      items = items.filter((e) => e.date <= filter.dateTo!);
    }

    if (filter.accountId) {
      items = items.filter((e) =>
        e.lineItems.some((li) => li.accountId === filter.accountId),
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

  async save(entry: JournalEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async update(entry: JournalEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async getNextEntryNumber(): Promise<string> {
    this.entryCounter++;
    return `JE-${String(this.entryCounter).padStart(6, '0')}`;
  }

  clear(): void {
    this.entries.clear();
    this.entryCounter = 0;
  }
}
