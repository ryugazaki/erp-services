import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapFinanceError } from './FinanceErrorMapper';
import { CreateAccountUseCase } from '../../application/use-cases/account/CreateAccountUseCase';
import { GetAccountUseCase } from '../../application/use-cases/account/GetAccountUseCase';
import { ListAccountsUseCase } from '../../application/use-cases/account/ListAccountsUseCase';
import { UpdateAccountUseCase } from '../../application/use-cases/account/UpdateAccountUseCase';
import { DeleteAccountUseCase } from '../../application/use-cases/account/DeleteAccountUseCase';

@injectable()
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createAccountUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Account created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getAccountUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Account retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listAccountsUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(ApiResponse.paginated(items, 'Accounts retrieved successfully', meta as any));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateAccountUseCase.execute({ ...req.body, id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Account updated successfully'));
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.deleteAccountUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(null, 'Account deleted successfully'));
  };
}
