import { z } from 'zod';

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
