// Espelho exato dos schemas Zod do backend — T033.
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Informe o nome.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(128, "A senha deve ter no máximo 128 caracteres."),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha.").max(128, "A senha deve ter no máximo 128 caracteres."),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
