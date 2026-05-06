import { z } from 'zod';

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(20).toUpperCase(),
  description: z.string().max(500).optional(),
  defaultDays: z.number().int().min(0),
  isPaid: z.boolean().default(true),
});

export type CreateLeaveTypeDTO = z.infer<typeof CreateLeaveTypeSchema>;
