import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { CreateLeaveTypeUseCase } from '../../application/use-cases/leave-type/CreateLeaveTypeUseCase';
import { ListLeaveTypesUseCase } from '../../application/use-cases/leave-type/ListLeaveTypesUseCase';
import { UpdateLeaveTypeUseCase } from '../../application/use-cases/leave-type/UpdateLeaveTypeUseCase';
import { ChangeLeaveTypeStatusUseCase } from '../../application/use-cases/leave-type/ChangeLeaveTypeStatusUseCase';

@injectable()
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly listLeaveTypesUseCase: ListLeaveTypesUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
    private readonly changeLeaveTypeStatusUseCase: ChangeLeaveTypeStatusUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createLeaveTypeUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Leave type created successfully', 201));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.listLeaveTypesUseCase.execute();

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave types retrieved successfully'));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateLeaveTypeUseCase.execute({ ...req.body, id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave type updated successfully'));
  };

  activate = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.changeLeaveTypeStatusUseCase.execute({
      id: req.params.id as string,
      action: 'activate',
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave type activated successfully'));
  };

  deactivate = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.changeLeaveTypeStatusUseCase.execute({
      id: req.params.id as string,
      action: 'deactivate',
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave type deactivated successfully'));
  };
}
