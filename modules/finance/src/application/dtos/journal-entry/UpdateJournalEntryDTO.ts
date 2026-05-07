import { z } from 'zod';

export const UpdateJournalEntrySchema = z.object({
  description: z.string().min(1).max(500),
});

export type UpdateJournalEntryDTO = z.infer<typeof UpdateJournalEntrySchema>;
