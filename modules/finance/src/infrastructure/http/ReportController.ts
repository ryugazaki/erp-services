import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapFinanceError } from './FinanceErrorMapper';
import { GenerateBalanceSheetUseCase } from '../../application/use-cases/report/GenerateBalanceSheetUseCase';
import { GenerateIncomeStatementUseCase } from '../../application/use-cases/report/GenerateIncomeStatementUseCase';
import { GenerateCashFlowUseCase } from '../../application/use-cases/report/GenerateCashFlowUseCase';
import { BalanceSheetQueryDTO } from '../../application/dtos/report/BalanceSheetQueryDTO';
import { IncomeStatementQueryDTO } from '../../application/dtos/report/IncomeStatementQueryDTO';
import { CashFlowQueryDTO } from '../../application/dtos/report/CashFlowQueryDTO';

@injectable()
export class ReportController {
  constructor(
    private readonly generateBalanceSheetUseCase: GenerateBalanceSheetUseCase,
    private readonly generateIncomeStatementUseCase: GenerateIncomeStatementUseCase,
    private readonly generateCashFlowUseCase: GenerateCashFlowUseCase,
  ) {}

  balanceSheet = async (req: Request, res: Response): Promise<Response> => {
    const dto: BalanceSheetQueryDTO = {
      asOfDate: req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date(),
    };

    const result = await this.generateBalanceSheetUseCase.execute(dto);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res
      .status(200)
      .json(ApiResponse.success(result.getValue(), 'Balance sheet generated successfully'));
  };

  incomeStatement = async (req: Request, res: Response): Promise<Response> => {
    const dto: IncomeStatementQueryDTO = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(),
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
      compareToPeriod: req.query.compareToPeriod === 'true',
    };

    const result = await this.generateIncomeStatementUseCase.execute(dto);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res
      .status(200)
      .json(ApiResponse.success(result.getValue(), 'Income statement generated successfully'));
  };

  cashFlow = async (req: Request, res: Response): Promise<Response> => {
    const dto: CashFlowQueryDTO = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(),
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
    };

    const result = await this.generateCashFlowUseCase.execute(dto);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Cash flow statement generated successfully'));
  };
}
