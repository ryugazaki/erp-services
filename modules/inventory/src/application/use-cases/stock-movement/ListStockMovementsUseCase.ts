import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IStockMovementRepository, StockMovementFilter } from '../../../domain/repositories/IStockMovementRepository';
import { ListStockMovementsDTO } from '../../dtos/stock-movement/ListStockMovementsDTO';

export interface ListStockMovementsInput extends ListStockMovementsDTO {}

export interface ListStockMovementsResult {
  items: Array<{
    id: string;
    productId: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    occurredAt: Date;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@injectable()
export class ListStockMovementsUseCase implements IUseCase<ListStockMovementsInput, Result<ListStockMovementsResult>> {
  constructor(private readonly stockMovementRepo: IStockMovementRepository) {}

  async execute(input: ListStockMovementsInput): Promise<Result<ListStockMovementsResult>> {
    const filter: StockMovementFilter = {
      productId: input.productId,
      warehouseId: input.warehouseId,
      movementType: input.movementType,
      referenceType: input.referenceType,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    };

    const result = await this.stockMovementRepo.findAll(filter, {
      page: input.page,
      limit: input.limit,
    });

    return Result.ok({
      items: result.items.map((m) => ({
        id: m.id,
        productId: m.productId,
        warehouseId: m.warehouseId,
        movementType: m.movementType,
        quantity: m.quantity,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        notes: m.notes,
        occurredAt: m.occurredAt,
      })),
      meta: result.meta,
    });
  }
}
