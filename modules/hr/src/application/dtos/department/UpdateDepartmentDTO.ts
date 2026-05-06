import { z } from 'zod';

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  headId: z.string().uuid().nullable().optional(),
});

export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>;
