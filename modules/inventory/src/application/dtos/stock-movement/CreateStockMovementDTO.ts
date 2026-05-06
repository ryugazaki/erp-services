import { z } from 'zod';

export const CreateStockMovementSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  movementType: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  occurredAt: z.coerce.date().optional(),
});

export type CreateStockMovementDTO = z.infer<typeof CreateStockMovementSchema>;
