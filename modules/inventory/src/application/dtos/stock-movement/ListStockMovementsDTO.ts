import { z } from 'zod';

export const ListStockMovementsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  movementType: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']).optional(),
  referenceType: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListStockMovementsDTO = z.infer<typeof ListStockMovementsSchema>;
