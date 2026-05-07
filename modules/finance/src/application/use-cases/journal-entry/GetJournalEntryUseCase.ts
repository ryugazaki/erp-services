import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';

export interface GetJournalEntryDTO {
  id: string;
}

export interface JournalEntryLineItemResult {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntryResult {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: string;
  lineItems: JournalEntryLineItemResult[];
  postedAt: Date | null;
  postedBy: string | null;
  reversalEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetJournalEntryUseCase implements IUseCase<GetJournalEntryDTO, Result<JournalEntryResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
  ) {}

  async execute(dto: GetJournalEntryDTO): Promise<Result<JournalEntryResult>> {
    const entry = await this.journalEntryRepo.findById(dto.id);

    if (!entry) {
      return Result.fail('JOURNAL_ENTRY_NOT_FOUND');
    }

    const lineItems: JournalEntryLineItemResult[] = entry.lineItems.map(item => ({
      id: item.id,
      accountId: item.accountId,
      description: item.description,
      debitAmount: item.debitAmount,
      creditAmount: item.creditAmount,
    }));

    return Result.ok({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      lineItems,
      postedAt: entry.postedAt,
      postedBy: entry.postedBy,
      reversalEntryId: entry.reversalEntryId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
}
