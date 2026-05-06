import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapInventoryError } from './InventoryErrorMapper';
import { CreateProductUseCase } from '../../application/use-cases/product/CreateProductUseCase';
import { GetProductUseCase } from '../../application/use-cases/product/GetProductUseCase';
import { ListProductsUseCase } from '../../application/use-cases/product/ListProductsUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/product/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/use-cases/product/DeleteProductUseCase';

@injectable()
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createProductUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Product created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getProductUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Product retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listProductsUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    const { items, meta } = result.getValue();
    return res.status(200).json(ApiResponse.paginated(items, 'Products retrieved successfully', meta));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateProductUseCase.execute({ id: req.params.id as string, ...req.body });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Product updated successfully'));
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.deleteProductUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message, code } = mapInventoryError(result.getError());
      return res.status(status).json(ApiResponse.error(code, message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Product deleted successfully'));
  };
}
