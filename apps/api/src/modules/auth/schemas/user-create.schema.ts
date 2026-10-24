// Espelho de data-model.md §4 e contracts/openapi.yaml (UserCreate) — T030.
import { z } from 'zod';

export const userCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email('Informe um e-mail válido.'))
      .pipe(z.string().max(320, 'O e-mail deve ter no máximo 320 caracteres.')),
    password: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres.')
      .max(128, 'A senha deve ter no máximo 128 caracteres.'),
  })
  .strict();

export type UserCreateInput = z.infer<typeof userCreateSchema>;
