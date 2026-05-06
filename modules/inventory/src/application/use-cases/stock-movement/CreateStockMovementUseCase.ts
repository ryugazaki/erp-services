import { injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IStockMovementRepository } from '../../../domain/repositories/IStockMovementRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IWarehouseRepository } from '../../../domain/repositories/IWarehouseRepository';
import { StockMovement } from '../../../domain/entities/StockMovement';
import { IEventBus } from '@erp/core/event-bus';
import { CreateStockMovementDTO } from '../../dtos/stock-movement/CreateStockMovementDTO';

export interface CreateStockMovementInput extends CreateStockMovementDTO {}

export interface CreateStockMovementResult {
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
export class CreateStockMovementUseCase implements IUseCase<CreateStockMovementInput, Result<CreateStockMovementResult>> {
  constructor(
    private readonly stockMovementRepo: IStockMovementRepository,
    private readonly productRepo: IProductRepository,
    private readonly warehouseRepo: IWarehouseRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateStockMovementInput): Promise<Result<CreateStockMovementResult>> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) return Result.fail('PRODUCT_NOT_FOUND');
    if (!product.isActive) return Result.fail('PRODUCT_NOT_ACTIVE');

    const warehouse = await this.warehouseRepo.findById(input.warehouseId);
    if (!warehouse) return Result.fail('WAREHOUSE_NOT_FOUND');
    if (!warehouse.isActive) return Result.fail('WAREHOUSE_NOT_ACTIVE');

    const movementResult = StockMovement.create({
      productId: input.productId,
      warehouseId: input.warehouseId,
      movementType: input.movementType,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
      occurredAt: input.occurredAt,
    });

    if (movementResult.isFailure()) return Result.fail(movementResult.getError());

    const movement = movementResult.getValue();
    await this.stockMovementRepo.save(movement);

    for (const event of movement.pullEvents()) {
      await this.eventBus.publish(event);
    }

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
