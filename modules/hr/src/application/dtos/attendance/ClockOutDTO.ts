import { z } from 'zod';

export const ClockOutSchema = z.object({
  employeeId: z.string().uuid(),
});

export type ClockOutDTO = z.infer<typeof ClockOutSchema>;
