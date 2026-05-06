import { z } from 'zod';

export const ChangeEmployeeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED']),
});

export type ChangeEmployeeStatusDTO = z.infer<typeof ChangeEmployeeStatusSchema>;
