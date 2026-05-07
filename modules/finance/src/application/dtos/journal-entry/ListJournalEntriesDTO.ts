import { z } from 'zod';

export const ListJournalEntriesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'POSTED', 'REVERSED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: z.string().uuid().optional(),
});

export type ListJournalEntriesDTO = z.infer<typeof ListJournalEntriesSchema>;
