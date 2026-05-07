import { z } from 'zod';

export const ListAccountsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type ListAccountsDTO = z.infer<typeof ListAccountsSchema>;
