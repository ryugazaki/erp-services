import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IJournalEntryRepository, type JournalEntryFilter, type PaginationInput } from '../../../domain/repositories/IJournalEntryRepository';
import { ListJournalEntriesDTO } from '../../dtos';

export interface JournalEntryLineItemResult {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntryListItem {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: string;
  lineItems: JournalEntryLineItemResult[];
  postedAt: Date | null;
  postedBy: string | null;
  createdAt: Date;
}

export interface ListJournalEntriesResult {
  items: JournalEntryListItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ListJournalEntriesUseCase implements IUseCase<ListJournalEntriesDTO, Result<ListJournalEntriesResult>> {
  constructor(
    private readonly journalEntryRepo: IJournalEntryRepository,
  ) {}

  async execute(dto: ListJournalEntriesDTO): Promise<Result<ListJournalEntriesResult>> {
    const filter: JournalEntryFilter = {
      status: dto.status,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      accountId: dto.accountId,
    };

    const pagination: PaginationInput = {
      page: dto.page,
      limit: dto.limit,
    };

    const result = await this.journalEntryRepo.findAll(filter, pagination);

    const items: JournalEntryListItem[] = result.items.map(entry => ({
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      lineItems: entry.lineItems.map(item => ({
        id: item.id,
        accountId: item.accountId,
        description: item.description,
        debitAmount: item.debitAmount,
        creditAmount: item.creditAmount,
      })),
      postedAt: entry.postedAt,
      postedBy: entry.postedBy,
      createdAt: entry.createdAt,
    }));

    return Result.ok({
      items,
      meta: result.meta,
    });
  }
}
