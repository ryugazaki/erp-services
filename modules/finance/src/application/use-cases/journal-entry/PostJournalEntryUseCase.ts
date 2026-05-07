import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { JournalEntry } from '../../../domain/entities/JournalEntry';

export interface PostJournalEntryDTO {
  entryId: string;
  postedBy: string;
}

export interface JournalEntryResult {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: string;
  postedAt: Date;
  postedBy: string;
  updatedAt: Date;
}

export class PostJournalEntryUseCase implements IUseCase<PostJournalEntryDTO, Result<JournalEntryResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: PostJournalEntryDTO): Promise<Result<JournalEntryResult>> {
    const entry = await this.journalEntryRepo.findById(dto.entryId);

    if (!entry) {
      return Result.fail('JOURNAL_ENTRY_NOT_FOUND');
    }

    // Post the journal entry
    const postResult = entry.post(dto.postedBy);

    if (postResult.isFailure()) {
      return Result.fail(postResult.getError());
    }

    // Save to repository
    await this.journalEntryRepo.update(entry);

    // Pull and publish domain events
    const events = entry.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      postedAt: entry.postedAt!,
      postedBy: entry.postedBy!,
      updatedAt: entry.updatedAt,
    });
  }
}
