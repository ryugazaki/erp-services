import { z } from 'zod';

export const BalanceSheetQuerySchema = z.object({
  asOfDate: z.coerce.date().default(new Date()),
});

export type BalanceSheetQueryDTO = z.infer<typeof BalanceSheetQuerySchema>;
