import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { Account } from '../../../domain/entities/Account';
import { CreateAccountDTO } from '../../dtos';

export interface CreateAccountResult {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  isActive: boolean;
}

export class CreateAccountUseCase implements IUseCase<CreateAccountDTO, Result<CreateAccountResult>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateAccountDTO): Promise<Result<CreateAccountResult>> {
    // Check code uniqueness
    const existingByCode = await this.accountRepo.findByCode(dto.code);
    if (existingByCode) {
      return Result.fail('ACCOUNT_CODE_EXISTS');
    }

    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.accountRepo.findById(dto.parentId);
      if (!parent) {
        return Result.fail('ACCOUNT_PARENT_NOT_FOUND');
      }

      // Check for circular reference
      if (parent.code === dto.code.substring(0, parent.code.length)) {
        return Result.fail('ACCOUNT_CIRCULAR_REFERENCE');
      }
    }

    // Create account
    const accountResult = Account.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      parentId: dto.parentId,
    });

    if (accountResult.isFailure()) {
      return Result.fail(accountResult.getError());
    }

    const account = accountResult.getValue();

    // Save to repository
    await this.accountRepo.save(account);

    // Pull and publish domain events
    const events = account.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      isActive: account.isActive,
    });
  }
}
