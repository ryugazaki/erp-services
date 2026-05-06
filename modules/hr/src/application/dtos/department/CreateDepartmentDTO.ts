import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  headId: z.string().uuid().optional(),
});

export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>;
