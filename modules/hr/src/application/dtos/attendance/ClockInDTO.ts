import { z } from 'zod';

export const ClockInSchema = z.object({
  employeeId: z.string().uuid(),
});

export type ClockInDTO = z.infer<typeof ClockInSchema>;
