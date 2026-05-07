import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';

export interface GetAccountDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export class GetAccountUseCase implements IUseCase<GetAccountDTO, Result<AccountResult>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(dto: GetAccountDTO): Promise<Result<AccountResult>> {
    const account = await this.accountRepo.findById(dto.id);

    if (!account) {
      return Result.fail('ACCOUNT_NOT_FOUND');
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
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  }
}
