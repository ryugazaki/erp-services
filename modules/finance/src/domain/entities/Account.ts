import { AggregateRoot, Result } from '@erp/shared/kernel';
import { AccountCode } from '../value-objects/AccountCode';
import { AccountType } from '../value-objects/AccountType';
import { AccountCreated } from '../events/AccountCreated';
import { AccountUpdated } from '../events/AccountUpdated';
import { AccountDeactivated } from '../events/AccountDeactivated';

export interface AccountState {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  parentId: string | null;
  isActive: boolean;
  isSystemAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountProps {
  code: string;
  name: string;
  description?: string;
  type: string;
  parentId?: string;
}

export class Account extends AggregateRoot {
  private constructor(private state: AccountState) {
    super();
  }

  get id(): string { return this.state.id; }
  get code(): string { return this.state.code; }
  get name(): string { return this.state.name; }
  get description(): string | null { return this.state.description; }
  get type(): string { return this.state.type; }
  get parentId(): string | null { return this.state.parentId; }
  get isActive(): boolean { return this.state.isActive; }
  get isSystemAccount(): boolean { return this.state.isSystemAccount; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateAccountProps): Result<Account> {
    const codeResult = AccountCode.create(props.code);
    if (codeResult.isFailure()) {
      return Result.fail(codeResult.getError());
    }

    const typeResult = AccountType.create(props.type);
    if (typeResult.isFailure()) {
      return Result.fail(typeResult.getError());
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('ACCOUNT_NAME_REQUIRED');
    }

    const now = new Date();
    const account = new Account({
      id: crypto.randomUUID(),
      code: codeResult.getValue().value,
      name: props.name.trim(),
      description: props.description?.trim() || null,
      type: typeResult.getValue().value,
      parentId: props.parentId || null,
      isActive: true,
      isSystemAccount: false,
      createdAt: now,
      updatedAt: now,
    });

    account.recordEvent(new AccountCreated(
      account.id,
      account.code,
      account.name,
      account.type,
    ));

    return Result.ok(account);
  }

  static reconstitute(state: AccountState): Account {
    return new Account(state);
  }

  updateDetails(props: { name?: string; description?: string }): Result<void> {
    if (this.state.isSystemAccount) {
      return Result.fail('ACCOUNT_IS_SYSTEM');
    }

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        return Result.fail('ACCOUNT_NAME_REQUIRED');
      }
      this.state.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.state.description = props.description?.trim() || null;
    }

    this.state.updatedAt = new Date();

    this.recordEvent(new AccountUpdated(this.id, this.code));

    return Result.ok(undefined);
  }

  deactivate(hasJournalEntries: boolean): Result<void> {
    if (this.state.isSystemAccount) {
      return Result.fail('ACCOUNT_IS_SYSTEM');
    }

    if (!this.state.isActive) {
      return Result.fail('ACCOUNT_ALREADY_INACTIVE');
    }

    if (hasJournalEntries) {
      return Result.fail('ACCOUNT_HAS_JOURNAL_ENTRIES');
    }

    this.state.isActive = false;
    this.state.updatedAt = new Date();

    this.recordEvent(new AccountDeactivated(this.id, this.code));

    return Result.ok(undefined);
  }

  getTypeValue(): AccountType {
    return AccountType.fromValue(this.state.type as any);
  }

  getCodeValue(): AccountCode {
    return AccountCode.fromValue(this.state.code);
  }
}
