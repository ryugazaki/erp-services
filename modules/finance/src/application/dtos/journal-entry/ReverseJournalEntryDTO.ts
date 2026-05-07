import { z } from 'zod';

export const ReverseJournalEntrySchema = z.object({
  reason: z.string().max(500).optional(),
});

export type ReverseJournalEntryDTO = z.infer<typeof ReverseJournalEntrySchema>;
