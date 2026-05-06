import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IStockMovementRepository } from '../../../domain/repositories/IStockMovementRepository';

export interface GetStockMovementInput {
  id: string;
}

export interface GetStockMovementResult {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  occurredAt: Date;
}

@injectable()
export class GetStockMovementUseCase implements IUseCase<GetStockMovementInput, Result<GetStockMovementResult>> {
  constructor(private readonly stockMovementRepo: IStockMovementRepository) {}

  async execute(input: GetStockMovementInput): Promise<Result<GetStockMovementResult>> {
    const movement = await this.stockMovementRepo.findById(input.id);
    if (!movement) return Result.fail('STOCK_MOVEMENT_NOT_FOUND');

    return Result.ok({
      id: movement.id,
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      occurredAt: movement.occurredAt,
    });
  }
}
