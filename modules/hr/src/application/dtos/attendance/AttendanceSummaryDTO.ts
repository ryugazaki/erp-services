import { z } from 'zod';

export const AttendanceSummarySchema = z.object({
  employeeId: z.string().uuid(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
});

export type AttendanceSummaryDTO = z.infer<typeof AttendanceSummarySchema>;
