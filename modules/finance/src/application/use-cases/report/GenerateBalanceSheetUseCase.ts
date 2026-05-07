import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { BalanceSheetQueryDTO } from '../../dtos';

export interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export interface BalanceSheetReport {
  asOfDate: Date;
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  liabilitiesAndEquity: number;
}

export class GenerateBalanceSheetUseCase implements IUseCase<BalanceSheetQueryDTO, Result<BalanceSheetReport>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly journalEntryRepo: IJournalEntryRepository,
  ) {}

  async execute(dto: BalanceSheetQueryDTO): Promise<Result<BalanceSheetReport>> {
    // Get all active accounts
    const accountsResult = await this.accountRepo.findAll(
      { isActive: true },
      { page: 1, limit: 1000 }
    );

    // TODO: Implement actual balance calculation from journal entries
    // For now, return a placeholder structure

    return Result.ok({
      asOfDate: dto.asOfDate,
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      liabilitiesAndEquity: 0,
    });
  }
}
