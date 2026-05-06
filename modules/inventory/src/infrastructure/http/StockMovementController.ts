import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapInventoryError } from './InventoryErrorMapper';
import { CreateStockMovementUseCase } from '../../application/use-cases/stock-movement/CreateStockMovementUseCase';
import { GetStockMovementUseCase } from '../../application/use-cases/stock-movement/GetStockMovementUseCase';
import { ListStockMovementsUseCase } from '../../application/use-cases/stock-movement/ListStockMovementsUseCase';

@injectable()
export class StockMovementController {
  constructor(
    private readonly createStockMovementUseCase: CreateStockMovementUseCase,
    private readonly getStockMovementUseCase: GetStockMovementUseCase,
    private readonly listStockMovementsUseCase: ListStockMovementsUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createStockMovementUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Stock movement created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getStockMovementUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Stock movement retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listStockMovementsUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    const { items, meta } = result.getValue();
    return res.status(200).json(ApiResponse.paginated(items, 'Stock movements retrieved successfully', meta));
  };
}
