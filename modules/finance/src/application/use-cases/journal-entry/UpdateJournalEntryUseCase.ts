import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { UpdateJournalEntryDTO } from '../../dtos';

export interface UpdateJournalEntryInput extends UpdateJournalEntryDTO {
  id: string;
}

export interface JournalEntryResult {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: string;
  updatedAt: Date;
}

export class UpdateJournalEntryUseCase implements IUseCase<UpdateJournalEntryInput, Result<JournalEntryResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateJournalEntryInput): Promise<Result<JournalEntryResult>> {
    const entry = await this.journalEntryRepo.findById(input.id);

    if (!entry) {
      return Result.fail('JOURNAL_ENTRY_NOT_FOUND');
    }

    // Update description only (line items are immutable after creation)
    const updateResult = entry.updateDescription(input.description);

    if (updateResult.isFailure()) {
      return Result.fail(updateResult.getError());
    }

    // Save to repository
    await this.journalEntryRepo.update(entry);

    return Result.ok({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      updatedAt: entry.updatedAt,
    });
  }
}
