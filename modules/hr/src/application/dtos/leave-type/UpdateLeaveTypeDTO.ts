import { z } from 'zod';

export const UpdateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  defaultDays: z.number().int().min(0).optional(),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLeaveTypeDTO = z.infer<typeof UpdateLeaveTypeSchema>;
