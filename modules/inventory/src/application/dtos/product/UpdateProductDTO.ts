import { z } from 'zod';

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unitOfMeasure: z.enum(['PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK']).optional(),
  basePrice: z.number().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
});

export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;
