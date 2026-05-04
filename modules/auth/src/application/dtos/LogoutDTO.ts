import { z } from 'zod';

export const LogoutSchema = z.object({
  allDevices: z.boolean().optional().default(false),
});

export type LogoutDTO = z.infer<typeof LogoutSchema>;
