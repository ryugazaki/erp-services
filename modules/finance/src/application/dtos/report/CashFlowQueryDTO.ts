import { z } from 'zod';

export const CashFlowQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CashFlowQueryDTO = z.infer<typeof CashFlowQuerySchema>;
