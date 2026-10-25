import { z } from 'zod';

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(128),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres.')
      .max(128),
  })
  .strict()
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ['newPassword'],
    message: 'Escolha uma senha diferente da atual.',
  });
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
