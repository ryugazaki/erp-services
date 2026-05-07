import { DomainEvent } from '@erp/shared/kernel';

export class JournalEntryReversed extends DomainEvent {
  constructor(
    public readonly entryId: string,
    public readonly reversalEntryId: string,
    public readonly reason: string,
  ) {
    super('finance.journal.reversed');
  }
}
