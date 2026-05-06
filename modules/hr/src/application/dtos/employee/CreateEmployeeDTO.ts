import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  position: z.string().max(100).optional(),
  hireDate: z.coerce.date(),
});

export type CreateEmployeeDTO = z.infer<typeof CreateEmployeeSchema>;
