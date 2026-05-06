import { z } from 'zod';

export const ListProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
});

export type ListProductsDTO = z.infer<typeof ListProductsSchema>;
