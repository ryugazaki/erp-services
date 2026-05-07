import { z } from 'zod';

export const InvoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative().default(0),
});

export const CreateInvoiceSchema = z.object({
  type: z.enum(['RECEIVABLE', 'PAYABLE']),
  customerId: z.string().uuid(),
  customerName: z.string().min(1).max(100),
  date: z.coerce.date(),
  dueDate: z.coerce.date(),
  lineItems: z.array(InvoiceLineItemSchema).min(1, 'Invoice must have at least 1 line item'),
  notes: z.string().max(1000).optional(),
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceLineItemDTO = z.infer<typeof InvoiceLineItemSchema>;
