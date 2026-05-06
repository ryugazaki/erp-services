import { z } from 'zod';

export const ListAttendancesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().uuid().optional(),
  status: z.enum(['CLOCKED_IN', 'CLOCKED_OUT', 'ABSENT']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListAttendancesDTO = z.infer<typeof ListAttendancesSchema>;
