import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { CreateDepartmentUseCase } from '../../application/use-cases/department/CreateDepartmentUseCase';
import { GetDepartmentUseCase } from '../../application/use-cases/department/GetDepartmentUseCase';
import { ListDepartmentsUseCase } from '../../application/use-cases/department/ListDepartmentsUseCase';
import { UpdateDepartmentUseCase } from '../../application/use-cases/department/UpdateDepartmentUseCase';

export class DepartmentController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly getDepartmentUseCase: GetDepartmentUseCase,
    private readonly listDepartmentsUseCase: ListDepartmentsUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createDepartmentUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Department created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getDepartmentUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Department retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listDepartmentsUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(
      ApiResponse.paginated(items, 'Departments retrieved successfully', meta as any),
    );
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateDepartmentUseCase.execute({ ...req.body, id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Department updated successfully'));
  };
}
