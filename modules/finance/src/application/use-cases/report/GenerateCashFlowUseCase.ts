import { Result } from '@erp/shared/kernel';
import { IUseCase } from '@erp/shared/kernel';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IJournalEntryRepository } from '../../../domain/repositories/IJournalEntryRepository';
import { CashFlowQueryDTO } from '../../dtos';

export interface CashFlowItem {
  accountId: string;
  code: string;
  name: string;
  amount: number;
}

export interface CashFlowReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  operatingActivities: CashFlowItem[];
  investingActivities: CashFlowItem[];
  financingActivities: CashFlowItem[];
  netCashFromOperating: number;
  netCashFromInvesting: number;
  netCashFromFinancing: number;
  netChangeInCash: number;
}

export class GenerateCashFlowUseCase implements IUseCase<CashFlowQueryDTO, Result<CashFlowReport>> {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly journalEntryRepo: IJournalEntryRepository,
  ) {}

  async execute(dto: CashFlowQueryDTO): Promise<Result<CashFlowReport>> {
    // TODO: Implement actual cash flow calculation from journal entries
    // For now, return a placeholder structure

    return Result.ok({
      period: {
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      operatingActivities: [],
      investingActivities: [],
      financingActivities: [],
      netCashFromOperating: 0,
      netCashFromInvesting: 0,
      netCashFromFinancing: 0,
      netChangeInCash: 0,
    });
  }
}
