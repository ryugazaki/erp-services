import { z } from 'zod';

export const ListEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESIGNED']).optional(),
  search: z.string().optional(),
});

export type ListEmployeesDTO = z.infer<typeof ListEmployeesSchema>;
