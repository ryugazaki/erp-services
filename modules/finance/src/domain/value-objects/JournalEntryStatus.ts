import { Result } from '@erp/shared/kernel';

export type JournalEntryStatusEnum = 'DRAFT' | 'POSTED' | 'REVERSED';

const VALID_STATUSES: JournalEntryStatusEnum[] = ['DRAFT', 'POSTED', 'REVERSED'];

export class JournalEntryStatus {
  private constructor(public readonly value: JournalEntryStatusEnum) {}

  static create(rawValue: string): Result<JournalEntryStatus> {
    const upperValue = rawValue.toUpperCase() as JournalEntryStatusEnum;

    if (!VALID_STATUSES.includes(upperValue)) {
      return Result.fail('JOURNAL_ENTRY_STATUS_INVALID');
    }

    return Result.ok(new JournalEntryStatus(upperValue));
  }

  static fromValue(value: JournalEntryStatusEnum): JournalEntryStatus {
    return new JournalEntryStatus(value);
  }

  isDraft(): boolean { return this.value === 'DRAFT'; }
  isPosted(): boolean { return this.value === 'POSTED'; }
  isReversed(): boolean { return this.value === 'REVERSED'; }

  canPost(): boolean { return this.isDraft(); }
  canReverse(): boolean { return this.isPosted(); }

  equals(other: JournalEntryStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
