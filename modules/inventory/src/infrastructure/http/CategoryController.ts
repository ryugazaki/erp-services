import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapInventoryError } from './InventoryErrorMapper';
import { CreateCategoryUseCase } from '../../application/use-cases/category/CreateCategoryUseCase';
import { GetCategoryUseCase } from '../../application/use-cases/category/GetCategoryUseCase';
import { ListCategoriesUseCase } from '../../application/use-cases/category/ListCategoriesUseCase';
import { UpdateCategoryUseCase } from '../../application/use-cases/category/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from '../../application/use-cases/category/DeleteCategoryUseCase';

@injectable()
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createCategoryUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Category created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getCategoryUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Category retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listCategoriesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Categories retrieved successfully'));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateCategoryUseCase.execute({ id: req.params.id as string, ...req.body });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Category updated successfully'));
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.deleteCategoryUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Category deleted successfully'));
  };
}
