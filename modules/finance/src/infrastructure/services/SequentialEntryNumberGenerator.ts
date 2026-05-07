import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { EntryNumberGenerator } from '../../application/ports/EntryNumberGenerator';

@injectable()
export class SequentialEntryNumberGenerator implements EntryNumberGenerator {
  constructor(private readonly db: Kysely<any>) {}

  async generate(): Promise<string> {
    // Find the last entry number
    const result = await this.db
      .selectFrom('finance.journal_entries')
      .select('entry_number')
      .orderBy('entry_number', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!result || !result.entry_number) {
      return 'JE-000001';
    }

    // Extract number from JE-000001 format
    const parts = result.entry_number.split('-');
    const lastNumber = parseInt(parts[1] || '0', 10);
    const nextNumber = lastNumber + 1;

    return `JE-${nextNumber.toString().padStart(6, '0')}`;
  }
}
