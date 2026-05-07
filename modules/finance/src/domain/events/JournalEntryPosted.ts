import { DomainEvent } from '@erp/shared/kernel';

export class JournalEntryPosted extends DomainEvent {
  constructor(
    public readonly entryId: string,
    public readonly entryNumber: string,
    public readonly date: Date,
  ) {
    super('finance.journal.posted');
  }
}
