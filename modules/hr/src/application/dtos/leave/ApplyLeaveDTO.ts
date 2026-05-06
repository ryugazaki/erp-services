import { z } from 'zod';

export const ApplyLeaveSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(1).max(500),
});

export type ApplyLeaveDTO = z.infer<typeof ApplyLeaveSchema>;
