import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IAccountRepository, type AccountFilter, type PaginationInput } from '../../../domain/repositories/IAccountRepository';
import { ListAccountsDTO } from '../../dtos';

export interface AccountListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  isActive: boolean;
  isSystemAccount: boolean;
}

export interface ListAccountsResult {
  items: AccountListItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ListAccountsUseCase implements IUseCase<ListAccountsDTO, Result<ListAccountsResult>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(dto: ListAccountsDTO): Promise<Result<ListAccountsResult>> {
    const filter: AccountFilter = {
      type: dto.type,
      isActive: dto.isActive,
      search: dto.search,
    };

    const pagination: PaginationInput = {
      page: dto.page,
      limit: dto.limit,
    };

    const result = await this.accountRepo.findAll(filter, pagination);

    const items: AccountListItem[] = result.items.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      isActive: account.isActive,
      isSystemAccount: account.isSystemAccount,
    }));

    return Result.ok({
      items,
      meta: result.meta,
    });
  }
}
