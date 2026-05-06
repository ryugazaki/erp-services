import { z } from 'zod';

export const ReviewLeaveSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export type ReviewLeaveDTO = z.infer<typeof ReviewLeaveSchema>;
