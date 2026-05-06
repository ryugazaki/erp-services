import { z } from 'zod';

export const ListWarehousesSchema = z.object({
  isActive: z.boolean().optional(),
});

export type ListWarehousesDTO = z.infer<typeof ListWarehousesSchema>;
