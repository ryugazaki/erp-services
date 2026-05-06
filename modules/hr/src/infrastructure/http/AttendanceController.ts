import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapHrError } from './HrErrorMapper';
import { ClockInUseCase } from '../../application/use-cases/attendance/ClockInUseCase';
import { ClockOutUseCase } from '../../application/use-cases/attendance/ClockOutUseCase';
import { GetAttendanceUseCase } from '../../application/use-cases/attendance/GetAttendanceUseCase';
import { ListAttendancesUseCase } from '../../application/use-cases/attendance/ListAttendancesUseCase';
import { GetAttendanceSummaryUseCase } from '../../application/use-cases/attendance/GetAttendanceSummaryUseCase';

export class AttendanceController {
  constructor(
    private readonly clockInUseCase: ClockInUseCase,
    private readonly clockOutUseCase: ClockOutUseCase,
    private readonly getAttendanceUseCase: GetAttendanceUseCase,
    private readonly listAttendancesUseCase: ListAttendancesUseCase,
    private readonly getAttendanceSummaryUseCase: GetAttendanceSummaryUseCase,
  ) {}

  clockIn = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.clockInUseCase.execute({ employeeId: req.body.employeeId });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Clocked in successfully', 201));
  };

  clockOut = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.clockOutUseCase.execute({ employeeId: req.body.employeeId });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Clocked out successfully'));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getAttendanceUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Attendance retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listAttendancesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(
      ApiResponse.paginated(items, 'Attendances retrieved successfully', meta as any),
    );
  };

  getSummary = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getAttendanceSummaryUseCase.execute({
      employeeId: req.query.employeeId as string,
      month: Number(req.query.month),
      year: Number(req.query.year),
    });

    if (result.isFailure()) {
      const { status, message } = mapHrError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Attendance summary retrieved successfully'));
  };
}
