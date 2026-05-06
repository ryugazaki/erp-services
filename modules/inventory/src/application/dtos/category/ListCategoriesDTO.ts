import { z } from 'zod';

export const ListCategoriesSchema = z.object({
  isActive: z.boolean().optional(),
});

export type ListCategoriesDTO = z.infer<typeof ListCategoriesSchema>;
