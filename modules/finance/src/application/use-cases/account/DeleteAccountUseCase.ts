import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';

export interface DeleteAccountDTO {
  id: string;
}

export class DeleteAccountUseCase implements IUseCase<DeleteAccountDTO, Result<void>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: DeleteAccountDTO): Promise<Result<void>> {
    const account = await this.accountRepo.findById(dto.id);

    if (!account) {
      return Result.fail('ACCOUNT_NOT_FOUND');
    }

    // Check if account has journal entries
    const hasJournalEntries = await this.accountRepo.hasJournalEntries(dto.id);
    if (hasJournalEntries) {
      return Result.fail('ACCOUNT_HAS_JOURNAL_ENTRIES');
    }

    // Deactivate account (soft delete)
    const deactivateResult = account.deactivate(hasJournalEntries);
    if (deactivateResult.isFailure()) {
      return Result.fail(deactivateResult.getError());
    }

    // Save to repository
    await this.accountRepo.update(account);

    // Pull and publish domain events
    const events = account.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok(undefined);
  }
}
