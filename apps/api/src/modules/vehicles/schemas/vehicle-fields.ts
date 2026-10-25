// Campos e validações compartilhados entre cadastro e edição de veículos.
import { z } from 'zod';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_YEAR = CURRENT_YEAR + 1;

/** Campo opcional: string vazia vinda de formulário é tratada como ausente. */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** Formato Mercosul/antigo, após remover separadores: ABC1D23 ou ABC1234. */
export function normalizePlaca(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const placaField = z
  .string()
  .transform(normalizePlaca)
  .pipe(
    z
      .string()
      .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Placa inválida. Use o formato ABC1D23.'),
  );

export const marcaField = z
  .string()
  .trim()
  .min(1, 'Informe a marca.')
  .max(60, 'A marca deve ter no máximo 60 caracteres.');

export const modeloField = z
  .string()
  .trim()
  .min(1, 'Informe o modelo.')
  .max(80, 'O modelo deve ter no máximo 80 caracteres.');

export const anoField = z.coerce
  .number()
  .int('Informe um ano válido.')
  .min(1900, 'Informe um ano válido.')
  .max(MAX_YEAR, 'Informe um ano válido.');

export const chassiField = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z0-9]{17}$/, 'Chassi inválido. Deve ter 17 caracteres alfanuméricos.'));

const renavamField = z
  .string()
  .trim()
  .regex(/^\d{9,11}$/, 'RENAVAM inválido.');

const corField = z.string().trim().min(1, 'Cor inválida.').max(40, 'Cor inválida.');

const cilindradaField = z.coerce
  .number()
  .int('Cilindrada inválida.')
  .min(500, 'Cilindrada inválida.')
  .max(10_000, 'Cilindrada inválida.');

const tipoField = z.string().trim().min(1, 'Tipo inválido.').max(40, 'Tipo inválido.');

const ufField = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z]{2}$/, 'UF inválida.'));

const anoFabricacaoField = z.coerce
  .number()
  .int('Ano de fabricação inválido.')
  .min(1900, 'Ano de fabricação inválido.')
  .max(MAX_YEAR, 'Ano de fabricação inválido.');

// --- Variantes para create (ausente/null = não enviado) ---
export const optionalRenavam = z.preprocess(emptyToUndefined, renavamField.nullable().optional());
export const optionalCor = z.preprocess(emptyToUndefined, corField.nullable().optional());

export const optionalVehicleFields = {
  combustivel: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(40).nullable().optional()),
  apelido: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(80).nullable().optional()),
  cilindrada: z.preprocess(emptyToUndefined, cilindradaField.nullable().optional()),
  tipo: z.preprocess(emptyToUndefined, tipoField.nullable().optional()),
  uf: z.preprocess(emptyToUndefined, ufField.nullable().optional()),
  anoFabricacao: z.preprocess(emptyToUndefined, anoFabricacaoField.nullable().optional()),
};

// --- Variantes para update (null limpa o campo opcional) ---
export const nullableRenavam = z.preprocess(emptyToUndefined, renavamField.nullable().optional());
export const nullableCor = z.preprocess(emptyToUndefined, corField.nullable().optional());

export const nullableVehicleFields = {
  combustivel: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(40).nullable().optional()),
  apelido: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(80).nullable().optional()),
  cilindrada: z.preprocess(emptyToUndefined, cilindradaField.nullable().optional()),
  tipo: z.preprocess(emptyToUndefined, tipoField.nullable().optional()),
  uf: z.preprocess(emptyToUndefined, ufField.nullable().optional()),
  anoFabricacao: z.preprocess(emptyToUndefined, anoFabricacaoField.nullable().optional()),
};
