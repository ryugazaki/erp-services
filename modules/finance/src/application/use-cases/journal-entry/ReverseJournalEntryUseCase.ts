import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { JournalEntry } from '../../../domain/entities/JournalEntry';
import { ReverseJournalEntryDTO } from '../../dtos';

export interface ReverseJournalEntryInput {
  entryId: string;
  reversedBy: string;
}

export interface ReversalResult {
  originalEntryId: string;
  originalEntryNumber: string;
  reversalEntryId: string;
  reversalEntryNumber: string;
  reason: string | null;
  reversedAt: Date;
}

export class ReverseJournalEntryUseCase implements IUseCase<ReverseJournalEntryInput, Result<ReversalResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ReverseJournalEntryInput & { reason?: string }): Promise<Result<ReversalResult>> {
    const entry = await this.journalEntryRepo.findById(input.entryId);

    if (!entry) {
      return Result.fail('JOURNAL_ENTRY_NOT_FOUND');
    }

    // Get next entry number for reversal entry
    const reversalEntryNumber = await this.journalEntryRepo.getNextEntryNumber();

    // Create reversal entry (flip debits and credits)
    const reversalLineItems = entry.lineItems.map(item => ({
      accountId: item.accountId,
      description: `Reversal: ${item.description}`,
      debitAmount: item.creditAmount,
      creditAmount: item.debitAmount,
    }));

    const reversalEntryResult = JournalEntry.create({
      date: new Date(),
      description: `Reversal of ${entry.entryNumber}: ${input.reason || 'No reason provided'}`,
      lineItems: reversalLineItems,
    }, reversalEntryNumber);

    if (reversalEntryResult.isFailure()) {
      return Result.fail(reversalEntryResult.getError());
    }

    const reversalEntry = reversalEntryResult.getValue();

    // Post the reversal entry immediately
    const postResult = reversalEntry.post(input.reversedBy);
    if (postResult.isFailure()) {
      return Result.fail(postResult.getError());
    }

    // Save both entries
    await this.journalEntryRepo.save(reversalEntry);

    // Mark original as reversed
    const reverseResult = entry.reverse(
      input.reason || 'Reversed',
      input.reversedBy,
      reversalEntry.id,
    );

    if (reverseResult.isFailure()) {
      return Result.fail(reverseResult.getError());
    }

    await this.journalEntryRepo.update(entry);

    // Pull and publish domain events from both entries
    const events = [...entry.pullEvents(), ...reversalEntry.pullEvents()];
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      originalEntryId: entry.id,
      originalEntryNumber: entry.entryNumber,
      reversalEntryId: reversalEntry.id,
      reversalEntryNumber: reversalEntry.entryNumber,
      reason: input.reason || null,
      reversedAt: new Date(),
    });
  }
}
