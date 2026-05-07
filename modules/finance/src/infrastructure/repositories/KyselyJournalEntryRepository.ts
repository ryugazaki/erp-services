import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IJournalEntryRepository, type JournalEntryFilter, type PaginationInput } from '../../domain/repositories/IJournalEntryRepository';
import { JournalEntry, type JournalLineItem } from '../../domain/entities/JournalEntry';
import { PaginatedResult, PaginationMeta } from '@erp/shared/kernel';

interface DatabaseJournalEntry {
  id: string;
  entry_number: string;
  date: Date;
  description: string;
  status: string;
  posted_at: Date | null;
  posted_by: string | null;
  reversal_entry_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseJournalLineItem {
  id: string;
  entry_id: string;
  account_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  created_at: Date;
}

@injectable()
export class KyselyJournalEntryRepository implements IJournalEntryRepository {
  constructor(private readonly db: Kysely<any>) {}

  async findById(id: string): Promise<JournalEntry | null> {
    const row = await this.db
      .selectFrom('finance.journal_entries')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const lineItems = await this.getLineItems(id);

    return this.toEntity(row as DatabaseJournalEntry, lineItems);
  }

  async findByEntryNumber(entryNumber: string): Promise<JournalEntry | null> {
    const row = await this.db
      .selectFrom('finance.journal_entries')
      .selectAll()
      .where('entry_number', '=', entryNumber)
      .executeTakeFirst();

    if (!row) return null;

    const lineItems = await this.getLineItems(row.id as string);

    return this.toEntity(row as DatabaseJournalEntry, lineItems);
  }

  async findAll(filter: JournalEntryFilter, pagination: PaginationInput): Promise<PaginatedResult<JournalEntry>> {
    const { page, limit } = pagination;

    let query = this.db
      .selectFrom('finance.journal_entries')
      .selectAll();

    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }

    if (filter.dateFrom) {
      query = query.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      query = query.where('date', '<=', filter.dateTo);
    }

    if (filter.accountId) {
      query = query
        .innerJoin('finance.journal_line_items as jli', 'finance.journal_entries.id', 'jli.entry_id')
        .where('jli.account_id', '=', filter.accountId)
        .distinct();
    }

    // Count query
    let countQuery = this.db
      .selectFrom('finance.journal_entries')
      .select(this.db.fn.countAll().as('count'));

    if (filter.status) {
      countQuery = countQuery.where('status', '=', filter.status);
    }

    if (filter.dateFrom) {
      countQuery = countQuery.where('date', '>=', filter.dateFrom);
    }

    if (filter.dateTo) {
      countQuery = countQuery.where('date', '<=', filter.dateTo);
    }

    if (filter.accountId) {
      countQuery = countQuery
        .innerJoin('finance.journal_line_items as jli', 'finance.journal_entries.id', 'jli.entry_id')
        .where('jli.account_id', '=', filter.accountId);
    }

    const [{ count }] = await countQuery.execute();
    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / limit);

    const rows = await query
      .orderBy('date', 'desc')
      .orderBy('entry_number', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .execute();

    const items: JournalEntry[] = [];
    for (const row of rows) {
      const lineItems = await this.getLineItems(row.id as string);
      items.push(this.toEntity(row as DatabaseJournalEntry, lineItems));
    }

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items,
      meta,
    };
  }

  async save(entry: JournalEntry): Promise<void> {
    await this.db
      .insertInto('finance.journal_entries')
      .values({
        id: entry.id,
        entry_number: entry.entryNumber,
        date: entry.date,
        description: entry.description,
        status: entry.status,
        posted_at: entry.postedAt,
        posted_by: entry.postedBy,
        reversal_entry_id: entry.reversalEntryId,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      })
      .execute();

    // Insert line items
    if (entry.lineItems.length > 0) {
      const lineItemValues = entry.lineItems.map(item => ({
        id: item.id,
        entry_id: entry.id,
        account_id: item.accountId,
        description: item.description,
        debit_amount: item.debitAmount,
        credit_amount: item.creditAmount,
      }));

      await this.db
        .insertInto('finance.journal_line_items')
        .values(lineItemValues)
        .execute();
    }
  }

  async update(entry: JournalEntry): Promise<void> {
    await this.db
      .updateTable('finance.journal_entries')
      .set({
        date: entry.date,
        description: entry.description,
        status: entry.status,
        posted_at: entry.postedAt,
        posted_by: entry.postedBy,
        reversal_entry_id: entry.reversalEntryId,
        updated_at: entry.updatedAt,
      })
      .where('id', '=', entry.id)
      .execute();
  }

  async getNextEntryNumber(): Promise<string> {
    // Find the last entry number and increment
    const result = await this.db
      .selectFrom('finance.journal_entries')
      .select('entry_number')
      .orderBy('entry_number', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!result || !result.entry_number) {
      return 'JE-000001';
    }

    const lastNumber = parseInt(result.entry_number.split('-')[1], 10);
    const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
    return `JE-${nextNumber}`;
  }

  private async getLineItems(entryId: string): Promise<JournalLineItem[]> {
    const rows = await this.db
      .selectFrom('finance.journal_line_items')
      .selectAll()
      .where('entry_id', '=', entryId)
      .orderBy('id', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      description: row.description,
      debitAmount: Number(row.debit_amount),
      creditAmount: Number(row.credit_amount),
    }));
  }

  private toEntity(row: DatabaseJournalEntry, lineItems: JournalLineItem[]): JournalEntry {
    return JournalEntry.reconstitute({
      id: row.id,
      entryNumber: row.entry_number,
      date: row.date,
      description: row.description,
      lineItems,
      status: row.status,
      postedAt: row.posted_at,
      postedBy: row.posted_by,
      reversalEntryId: row.reversal_entry_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
