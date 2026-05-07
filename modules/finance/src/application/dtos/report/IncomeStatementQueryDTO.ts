import { z } from 'zod';

export const IncomeStatementQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  compareToPeriod: z.boolean().optional(),
});

export type IncomeStatementQueryDTO = z.infer<typeof IncomeStatementQuerySchema>;
