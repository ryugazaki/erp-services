import { z } from 'zod';

export const UpdateWarehouseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(500).nullable().optional(),
  locationId: z.string().max(50).nullable().optional(),
});

export type UpdateWarehouseDTO = z.infer<typeof UpdateWarehouseSchema>;
