// Validação dos campos de cadastro e login no frontend.
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

/**
 * Formulário de cadastro do Figma (node 1-864): inclui a confirmação de senha,
 * que existe só no cliente — a API continua recebendo `RegisterPayload`.
 */
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha.").max(128, "A senha deve ter no máximo 128 caracteres."),
});

/** Payload aceito pela API (`POST /auth/register`). */
export type RegisterPayload = z.infer<typeof registerSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
