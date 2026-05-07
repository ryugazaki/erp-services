import { z } from 'zod';

export const RecordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type RecordPaymentDTO = z.infer<typeof RecordPaymentSchema>;
