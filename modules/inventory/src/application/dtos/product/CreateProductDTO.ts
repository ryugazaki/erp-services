import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  unitOfMeasure: z.enum(['PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK']),
  basePrice: z.number().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
});

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;
