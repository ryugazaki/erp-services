import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { CreateEmployeeUseCase } from '../../application/use-cases/employee/CreateEmployeeUseCase';
import { GetEmployeeUseCase } from '../../application/use-cases/employee/GetEmployeeUseCase';
import { ListEmployeesUseCase } from '../../application/use-cases/employee/ListEmployeesUseCase';
import { UpdateEmployeeUseCase } from '../../application/use-cases/employee/UpdateEmployeeUseCase';
import { ChangeEmployeeStatusUseCase } from '../../application/use-cases/employee/ChangeEmployeeStatusUseCase';

@injectable()
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly changeEmployeeStatusUseCase: ChangeEmployeeStatusUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createEmployeeUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Employee created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getEmployeeUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Employee retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listEmployeesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(
      ApiResponse.paginated(items, 'Employees retrieved successfully', meta as any),
    );
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateEmployeeUseCase.execute({ ...req.body, id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Employee updated successfully'));
  };

  changeStatus = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.changeEmployeeStatusUseCase.execute({
      id: req.params.id as string,
      status: req.body.status,
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Employee status changed successfully'));
  };
}
