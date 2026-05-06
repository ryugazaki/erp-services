import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapInventoryError } from './InventoryErrorMapper';
import { CreateWarehouseUseCase } from '../../application/use-cases/warehouse/CreateWarehouseUseCase';
import { GetWarehouseUseCase } from '../../application/use-cases/warehouse/GetWarehouseUseCase';
import { ListWarehousesUseCase } from '../../application/use-cases/warehouse/ListWarehousesUseCase';
import { UpdateWarehouseUseCase } from '../../application/use-cases/warehouse/UpdateWarehouseUseCase';
import { DeleteWarehouseUseCase } from '../../application/use-cases/warehouse/DeleteWarehouseUseCase';

@injectable()
export class WarehouseController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getWarehouseUseCase: GetWarehouseUseCase,
    private readonly listWarehousesUseCase: ListWarehousesUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly deleteWarehouseUseCase: DeleteWarehouseUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createWarehouseUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Warehouse created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getWarehouseUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Warehouse retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listWarehousesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Warehouses retrieved successfully'));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateWarehouseUseCase.execute({ id: req.params.id as string, ...req.body });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Warehouse updated successfully'));
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.deleteWarehouseUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Warehouse deleted successfully'));
  };
}
