import { z } from "zod";

const currentYear = new Date().getFullYear();
const maxYear = currentYear + 1;

const emptyToUndefined = (value: string | null | undefined) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = (schema: z.ZodString) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform(emptyToUndefined)
    .pipe(schema.nullable().optional());

const optionalInteger = (message: string, min: number, max?: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (typeof value !== "string") return value;
      if (value.trim() === "") return undefined;
      return Number(value);
    })
    .pipe(
      z
        .number()
        .int(message)
        .min(min, message)
        .max(max ?? Number.MAX_SAFE_INTEGER, message)
        .nullable()
        .optional(),
    );

const requiredYear = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "string" ? Number(value.trim()) : value))
  .pipe(
    z
      .number()
      .int("Informe um ano válido.")
      .min(1900, "Informe um ano válido.")
      .max(maxYear, "Informe um ano válido."),
  );

/** Espelho do POST /vehicles; campos do formulário numérico chegam como texto. */
export const vehicleSchema = z
  .object({
    placa: z
      .string()
      .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
      .pipe(z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida. Use o formato ABC1D23.")),
    marca: z.string().trim().min(1, "Informe a marca.").max(60, "A marca deve ter no máximo 60 caracteres."),
    modelo: z.string().trim().min(1, "Informe o modelo.").max(80, "O modelo deve ter no máximo 80 caracteres."),
    ano: requiredYear,
    chassi: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(z.string().regex(/^[A-Z0-9]{17}$/, "Chassi inválido. Deve ter 17 caracteres alfanuméricos.")),
    renavam: optionalString(z.string().trim().regex(/^\d{9,11}$/, "RENAVAM inválido.")),
    cor: optionalString(z.string().trim().min(1, "Cor inválida.").max(40, "Cor inválida.")),
    combustivel: optionalString(z.string().trim().min(1).max(40, "O combustível deve ter no máximo 40 caracteres.")),
    apelido: optionalString(z.string().trim().min(1).max(80, "O apelido deve ter no máximo 80 caracteres.")),
    cilindrada: optionalInteger("Cilindrada inválida.", 500, 10_000),
    tipo: optionalString(z.string().trim().min(1, "Tipo inválido.").max(40, "Tipo inválido.")),
    uf: optionalString(
      z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF inválida."),
    ),
    anoFabricacao: optionalInteger("Ano de fabricação inválido.", 1900, maxYear),
  })
  .strict();

export type VehicleFormValues = z.input<typeof vehicleSchema>;
export type VehicleCreateInput = z.output<typeof vehicleSchema>;
