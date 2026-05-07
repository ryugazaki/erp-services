import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapFinanceError } from './FinanceErrorMapper';
import { CreateJournalEntryUseCase } from '../../application/use-cases/journal-entry/CreateJournalEntryUseCase';
import { GetJournalEntryUseCase } from '../../application/use-cases/journal-entry/GetJournalEntryUseCase';
import { ListJournalEntriesUseCase } from '../../application/use-cases/journal-entry/ListJournalEntriesUseCase';
import { UpdateJournalEntryUseCase } from '../../application/use-cases/journal-entry/UpdateJournalEntryUseCase';
import { PostJournalEntryUseCase } from '../../application/use-cases/journal-entry/PostJournalEntryUseCase';
import { ReverseJournalEntryUseCase } from '../../application/use-cases/journal-entry/ReverseJournalEntryUseCase';

@injectable()
export class JournalEntryController {
  constructor(
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
    private readonly getJournalEntryUseCase: GetJournalEntryUseCase,
    private readonly listJournalEntriesUseCase: ListJournalEntriesUseCase,
    private readonly updateJournalEntryUseCase: UpdateJournalEntryUseCase,
    private readonly postJournalEntryUseCase: PostJournalEntryUseCase,
    private readonly reverseJournalEntryUseCase: ReverseJournalEntryUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createJournalEntryUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res
      .status(201)
      .json(ApiResponse.success(result.getValue(), 'Journal entry created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getJournalEntryUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Journal entry retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listJournalEntriesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res
      .status(200)
      .json(ApiResponse.paginated(items, 'Journal entries retrieved successfully', meta as any));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateJournalEntryUseCase.execute({
      ...req.body,
      id: req.params.id as string,
    });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Journal entry updated successfully'));
  };

  post = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.postJournalEntryUseCase.execute({
      entryId: req.params.id as string,
      postedBy: (req as any).user?.sub || 'system',
    });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Journal entry posted successfully'));
  };

  reverse = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.reverseJournalEntryUseCase.execute({
      entryId: req.params.id as string,
      reason: req.body.reason,
      reversedBy: (req as any).user?.sub || 'system',
    });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res
      .status(201)
      .json(ApiResponse.success(result.getValue(), 'Journal entry reversed successfully', 201));
  };
}
