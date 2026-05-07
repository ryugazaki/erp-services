import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { JournalEntry } from '../../../domain/entities/JournalEntry';
import { CreateJournalEntryDTO } from '../../dtos';

export interface CreateJournalEntryResult {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: string;
  lineItems: Array<{
    id: string;
    accountId: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
  }>;
  createdAt: Date;
}

export class CreateJournalEntryUseCase implements IUseCase<CreateJournalEntryDTO, Result<CreateJournalEntryResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateJournalEntryDTO): Promise<Result<CreateJournalEntryResult>> {
    // Get next entry number
    const entryNumber = await this.journalEntryRepo.getNextEntryNumber();

    // Create journal entry
    const entryResult = JournalEntry.create(dto, entryNumber);

    if (entryResult.isFailure()) {
      return Result.fail(entryResult.getError());
    }

    const entry = entryResult.getValue();

    // Save to repository
    await this.journalEntryRepo.save(entry);

    return Result.ok({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      lineItems: entry.lineItems,
      createdAt: entry.createdAt,
    });
  }
}
