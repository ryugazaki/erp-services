import { z } from 'zod';
import { InvoiceLineItemSchema } from './CreateInvoiceDTO';

export const UpdateInvoiceSchema = z.object({
  date: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  lineItems: z.array(InvoiceLineItemSchema).min(1).optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateInvoiceDTO = z.infer<typeof UpdateInvoiceSchema>;
