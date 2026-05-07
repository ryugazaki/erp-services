import { z } from 'zod';

export const JournalLineItemSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().max(500),
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
});

export const CreateJournalEntrySchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(500),
  lineItems: z.array(JournalLineItemSchema).min(2, 'Journal entry must have at least 2 line items'),
});

export type CreateJournalEntryDTO = z.infer<typeof CreateJournalEntrySchema>;
export type JournalLineItemDTO = z.infer<typeof JournalLineItemSchema>;
