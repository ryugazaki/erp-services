import { z } from 'zod';

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  position: z.string().max(100).optional(),
});

export type UpdateEmployeeDTO = z.infer<typeof UpdateEmployeeSchema>;
