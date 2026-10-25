import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(120, "O nome deve ter no máximo 120 caracteres."),
}).strict();

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileUpdateInput = z.output<typeof profileSchema>;

export const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "Informe seu nome.").max(120),
  lastName: z.string().trim().max(120),
}).refine(value => `${value.firstName} ${value.lastName}`.trim().length <= 120, {
  path: ["lastName"], message: "O nome completo deve ter no máximo 120 caracteres.",
}).transform(value => ({ name: [value.firstName, value.lastName].filter(Boolean).join(" ") }));

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual.").max(128),
  newPassword: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(128),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
}).refine(value => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"], message: "As senhas não coincidem.",
}).refine(value => value.newPassword !== value.currentPassword, {
  path: ["newPassword"], message: "Escolha uma senha diferente da atual.",
});
