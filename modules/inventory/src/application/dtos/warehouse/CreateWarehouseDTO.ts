import { z } from 'zod';

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  address: z.string().max(500).optional(),
  locationId: z.string().max(50).optional(),
});

export type CreateWarehouseDTO = z.infer<typeof CreateWarehouseSchema>;
