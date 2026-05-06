import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { CreateLeaveTypeUseCase } from '../../application/use-cases/leave-type/CreateLeaveTypeUseCase';
import { ListLeaveTypesUseCase } from '../../application/use-cases/leave-type/ListLeaveTypesUseCase';

@injectable()
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly listLeaveTypesUseCase: ListLeaveTypesUseCase,
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
}
