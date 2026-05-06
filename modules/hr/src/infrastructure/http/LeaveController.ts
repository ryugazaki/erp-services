import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { ApplyLeaveUseCase } from '../../application/use-cases/leave/ApplyLeaveUseCase';
import { ApproveLeaveUseCase } from '../../application/use-cases/leave/ApproveLeaveUseCase';
import { RejectLeaveUseCase } from '../../application/use-cases/leave/RejectLeaveUseCase';
import { CancelLeaveUseCase } from '../../application/use-cases/leave/CancelLeaveUseCase';
import { ListLeavesUseCase } from '../../application/use-cases/leave/ListLeavesUseCase';
import { GetLeaveUseCase } from '../../application/use-cases/leave/GetLeaveUseCase';

@injectable()
export class LeaveController {
  constructor(
    private readonly applyLeaveUseCase: ApplyLeaveUseCase,
    private readonly approveLeaveUseCase: ApproveLeaveUseCase,
    private readonly rejectLeaveUseCase: RejectLeaveUseCase,
    private readonly cancelLeaveUseCase: CancelLeaveUseCase,
    private readonly listLeavesUseCase: ListLeavesUseCase,
    private readonly getLeaveUseCase: GetLeaveUseCase,
  ) {}

  apply = async (req: Request, res: Response): Promise<Response> => {
    const employeeId = (req as any).user?.employeeId || req.body.employeeId;

    const result = await this.applyLeaveUseCase.execute({
      ...req.body,
      employeeId,
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Leave applied successfully', 201));
  };

  approve = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.approveLeaveUseCase.execute({
      ...req.body,
      leaveId: req.params.id as string,
      approvedBy: (req as any).user?.sub,
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave approved successfully'));
  };

  reject = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.rejectLeaveUseCase.execute({
      ...req.body,
      leaveId: req.params.id as string,
      rejectedBy: (req as any).user?.sub,
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave rejected successfully'));
  };

  cancel = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.cancelLeaveUseCase.execute({
      leaveId: req.params.id as string,
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave cancelled successfully'));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getLeaveUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Leave retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listLeavesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(
      ApiResponse.paginated(items, 'Leaves retrieved successfully', meta as any),
    );
  };
}
