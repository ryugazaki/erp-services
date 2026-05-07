import { AggregateRoot, Result } from '@erp/shared/kernel';
import { JournalEntryStatus } from '../value-objects/JournalEntryStatus';
import { Money } from '../value-objects/Money';
import { JournalEntryPosted } from '../events/JournalEntryPosted';
import { JournalEntryReversed } from '../events/JournalEntryReversed';

export interface JournalLineItem {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

export interface CreateLineItemProps {
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntryState {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  lineItems: JournalLineItem[];
  status: string;
  postedAt: Date | null;
  postedBy: string | null;
  reversalEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalEntryProps {
  date: Date;
  description: string;
  lineItems: CreateLineItemProps[];
}

export class JournalEntry extends AggregateRoot {
  private constructor(private state: JournalEntryState) {
    super();
  }

  get id(): string { return this.state.id; }
  get entryNumber(): string { return this.state.entryNumber; }
  get date(): Date { return this.state.date; }
  get description(): string { return this.state.description; }
  get lineItems(): JournalLineItem[] { return this.state.lineItems; }
  get status(): string { return this.state.status; }
  get postedAt(): Date | null { return this.state.postedAt; }
  get postedBy(): string | null { return this.state.postedBy; }
  get reversalEntryId(): string | null { return this.state.reversalEntryId; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateJournalEntryProps, entryNumber: string): Result<JournalEntry> {
    if (!props.description || props.description.trim().length === 0) {
      return Result.fail('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
    }

    if (!props.lineItems || props.lineItems.length < 2) {
      return Result.fail('JOURNAL_ENTRY_NO_LINE_ITEMS');
    }

    const lineItemsResult = JournalEntry.validateLineItems(props.lineItems);
    if (lineItemsResult.isFailure()) {
      return Result.fail(lineItemsResult.getError());
    }

    const now = new Date();
    const entry = new JournalEntry({
      id: crypto.randomUUID(),
      entryNumber,
      date: props.date,
      description: props.description.trim(),
      lineItems: lineItemsResult.getValue(),
      status: 'DRAFT',
      postedAt: null,
      postedBy: null,
      reversalEntryId: null,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(entry);
  }

  static reconstitute(state: JournalEntryState): JournalEntry {
    return new JournalEntry(state);
  }

  private static validateLineItems(items: CreateLineItemProps[]): Result<JournalLineItem[]> {
    const lineItems: JournalLineItem[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of items) {
      if (!item.accountId || item.accountId.trim().length === 0) {
        return Result.fail('JOURNAL_ENTRY_INVALID_ACCOUNT');
      }

      const debitResult = Money.create(item.debitAmount || 0);
      if (debitResult.isFailure()) {
        return Result.fail('JOURNAL_ENTRY_INVALID_DEBIT_AMOUNT');
      }

      const creditResult = Money.create(item.creditAmount || 0);
      if (creditResult.isFailure()) {
        return Result.fail('JOURNAL_ENTRY_INVALID_CREDIT_AMOUNT');
      }

      const debit = debitResult.getValue();
      const credit = creditResult.getValue();

      if (debit.isZero() && credit.isZero()) {
        return Result.fail('JOURNAL_ENTRY_LINE_ITEM_ZERO');
      }

      if (debit.isPositive() && credit.isPositive()) {
        return Result.fail('JOURNAL_ENTRY_LINE_ITEM_BOTH_DEBIT_CREDIT');
      }

      totalDebit += debit.amount;
      totalCredit += credit.amount;

      lineItems.push({
        id: crypto.randomUUID(),
        accountId: item.accountId,
        description: item.description?.trim() || '',
        debitAmount: debit.amount,
        creditAmount: credit.amount,
      });
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return Result.fail('JOURNAL_ENTRY_UNBALANCED');
    }

    if (totalDebit === 0 && totalCredit === 0) {
      return Result.fail('JOURNAL_ENTRY_ZERO_AMOUNT');
    }

    return Result.ok(lineItems);
  }

  post(postedBy: string): Result<void> {
    const status = JournalEntryStatus.fromValue(this.state.status as any);

    if (!status.canPost()) {
      if (status.isPosted()) {
        return Result.fail('JOURNAL_ENTRY_ALREADY_POSTED');
      }
      if (status.isReversed()) {
        return Result.fail('JOURNAL_ENTRY_ALREADY_REVERSED');
      }
    }

    this.state.status = 'POSTED';
    this.state.postedAt = new Date();
    this.state.postedBy = postedBy;
    this.state.updatedAt = new Date();

    this.recordEvent(new JournalEntryPosted(
      this.id,
      this.entryNumber,
      this.state.date,
    ));

    return Result.ok(undefined);
  }

  reverse(reason: string, reversedBy: string, reversalEntryId: string): Result<void> {
    const status = JournalEntryStatus.fromValue(this.state.status as any);

    if (!status.canReverse()) {
      if (status.isDraft()) {
        return Result.fail('JOURNAL_ENTRY_NOT_POSTED');
      }
      if (status.isReversed()) {
        return Result.fail('JOURNAL_ENTRY_ALREADY_REVERSED');
      }
    }

    this.state.status = 'REVERSED';
    this.state.reversalEntryId = reversalEntryId;
    this.state.updatedAt = new Date();

    this.recordEvent(new JournalEntryReversed(
      this.id,
      reversalEntryId,
      reason,
    ));

    return Result.ok(undefined);
  }

  updateDescription(description: string): Result<void> {
    const status = JournalEntryStatus.fromValue(this.state.status as any);

    if (!status.isDraft()) {
      return Result.fail('JOURNAL_ENTRY_NOT_DRAFT');
    }

    if (!description || description.trim().length === 0) {
      return Result.fail('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
    }

    this.state.description = description.trim();
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  getStatusValue(): JournalEntryStatus {
    return JournalEntryStatus.fromValue(this.state.status as any);
  }

  isDraft(): boolean { return this.state.status === 'DRAFT'; }
  isPosted(): boolean { return this.state.status === 'POSTED'; }
  isReversed(): boolean { return this.state.status === 'REVERSED'; }
}
