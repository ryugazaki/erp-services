import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
