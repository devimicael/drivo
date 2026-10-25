import { z } from 'zod';

const updateNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome.')
  .max(120, 'O nome deve ter no máximo 120 caracteres.');

export const userUpdateSchema = z.strictObject(
  { name: updateNameSchema },
  {
    error: (issue) => {
      if (issue.code === 'unrecognized_keys' && issue.keys.includes('email')) {
        return 'O e-mail não pode ser alterado nesta versão.';
      }
      return undefined;
    },
  },
);

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
