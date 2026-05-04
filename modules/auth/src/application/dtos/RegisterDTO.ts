import { z } from 'zod';
import { UserRole } from '../../domain/entities/User';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'GUEST'] as [UserRole, ...UserRole[]]),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
