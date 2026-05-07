import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { UpdateAccountDTO } from '../../dtos';

export interface UpdateAccountInput extends UpdateAccountDTO {
  id: string;
}

export interface AccountResult {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  parentId: string | null;
  isActive: boolean;
  isSystemAccount: boolean;
  updatedAt: Date;
}

export class UpdateAccountUseCase implements IUseCase<UpdateAccountInput, Result<AccountResult>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateAccountInput): Promise<Result<AccountResult>> {
    const account = await this.accountRepo.findById(input.id);

    if (!account) {
      return Result.fail('ACCOUNT_NOT_FOUND');
    }

    // Update account
    const updateResult = account.updateDetails({
      name: input.name,
      description: input.description,
    });

    if (updateResult.isFailure()) {
      return Result.fail(updateResult.getError());
    }

    // Save to repository
    await this.accountRepo.update(account);

    // Pull and publish domain events
    const events = account.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: account.id,
      code: account.code,
      name: account.name,
      description: account.description,
      type: account.type,
      parentId: account.parentId,
      isActive: account.isActive,
      isSystemAccount: account.isSystemAccount,
      updatedAt: account.updatedAt,
    });
  }
}
