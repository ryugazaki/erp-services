import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ApiResponse } from '@erp/core/http';
import { mapFinanceError } from './FinanceErrorMapper';
import { CreateInvoiceUseCase } from '../../application/use-cases/invoice/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from '../../application/use-cases/invoice/GetInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/invoice/ListInvoicesUseCase';
import { UpdateInvoiceUseCase } from '../../application/use-cases/invoice/UpdateInvoiceUseCase';
import { ValidateInvoiceUseCase } from '../../application/use-cases/invoice/ValidateInvoiceUseCase';
import { ChangeInvoiceStatusUseCase } from '../../application/use-cases/invoice/ChangeInvoiceStatusUseCase';
import { RecordPaymentUseCase } from '../../application/use-cases/invoice/RecordPaymentUseCase';
import { GetInvoicePaymentsUseCase } from '../../application/use-cases/invoice/GetInvoicePaymentsUseCase';

@injectable()
export class InvoiceController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly listInvoicesUseCase: ListInvoicesUseCase,
    private readonly updateInvoiceUseCase: UpdateInvoiceUseCase,
    private readonly validateInvoiceUseCase: ValidateInvoiceUseCase,
    private readonly changeInvoiceStatusUseCase: ChangeInvoiceStatusUseCase,
    private readonly recordPaymentUseCase: RecordPaymentUseCase,
    private readonly getInvoicePaymentsUseCase: GetInvoicePaymentsUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.createInvoiceUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Invoice created successfully', 201));
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getInvoiceUseCase.execute({ id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Invoice retrieved successfully'));
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await this.listInvoicesUseCase.execute(query as any);

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    const { items, meta } = result.getValue();

    return res.status(200).json(ApiResponse.paginated(items, 'Invoices retrieved successfully', meta as any));
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.updateInvoiceUseCase.execute({ ...req.body, id: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Invoice updated successfully'));
  };

  validate = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.validateInvoiceUseCase.execute({ invoiceId: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Invoice validated successfully'));
  };

  changeStatus = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.changeInvoiceStatusUseCase.execute({
      invoiceId: req.params.id as string,
      status: req.body.status,
    });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Invoice status changed successfully'));
  };

  recordPayment = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.recordPaymentUseCase.execute({
      invoiceId: req.params.id as string,
      ...req.body,
    });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(201).json(ApiResponse.success(result.getValue(), 'Payment recorded successfully', 201));
  };

  getPayments = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.getInvoicePaymentsUseCase.execute({ invoiceId: req.params.id as string });

    if (result.isFailure()) {
      const { status, message } = mapFinanceError(result.getError());
      return res.status(status).json(ApiResponse.error(result.getError(), message, status));
    }

    return res.status(200).json(ApiResponse.success(result.getValue(), 'Invoice payments retrieved successfully'));
  };
}
