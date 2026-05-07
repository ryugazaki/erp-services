import { z } from 'zod';

export const ChangeInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'CANCELLED']),
});

export type ChangeInvoiceStatusDTO = z.infer<typeof ChangeInvoiceStatusSchema>;
