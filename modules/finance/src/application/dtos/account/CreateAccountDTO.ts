import { z } from 'zod';

export const CreateAccountSchema = z.object({
  code: z.string().min(1).regex(/^\d+(?:-\d+)*$/, 'Invalid account code format'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().uuid().optional(),
});

export type CreateAccountDTO = z.infer<typeof CreateAccountSchema>;
