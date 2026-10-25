import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();
const currentYear = new Date().getFullYear() + 1;

/** Sanitize untrusted model output by dropping invalid individual values. */
export const crlvExtractionSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/).optional(),
  marca: optionalText(60),
  modelo: optionalText(80),
  ano: z.coerce.number().int().min(1900).max(currentYear).optional(),
  chassi: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/).optional(),
  renavam: z.string().trim().pipe(z.string().regex(/^\d{9,11}$/)).optional(),
  cor: optionalText(40),
  combustivel: optionalText(40),
  cilindrada: z.coerce.number().int().min(500).max(10_000).optional(),
  tipo: optionalText(40),
  uf: z.string().regex(/^[A-Z]{2}$/).optional(),
  anoFabricacao: z.coerce.number().int().min(1900).max(currentYear).optional(),
}).strip();

export type CrlvExtraction = z.infer<typeof crlvExtractionSchema>;

/** Keep valid fields even when another model field is malformed. */
export function sanitizeCrlvExtraction(input: unknown): CrlvExtraction {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, unknown> = {};
  const candidate = input as Record<string, unknown>;
  for (const [key, schema] of Object.entries(crlvExtractionSchema.shape)) {
    const parsed = schema.safeParse(candidate[key]);
    if (parsed.success && parsed.data !== undefined) output[key] = parsed.data;
  }
  return output as CrlvExtraction;
}
