// Validação dos campos aceitos no login.
import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Informe o e-mail.')
      .pipe(z.email('Informe um e-mail válido.'))
      .pipe(z.string().max(320, 'O e-mail deve ter no máximo 320 caracteres.')),
    // 1–128: a regra de 8+ caracteres vale no cadastro, não no login.
    password: z
      .string()
      .min(1, 'Informe a senha.')
      .max(128, 'A senha deve ter no máximo 128 caracteres.'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
