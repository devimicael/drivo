// Valida o ambiente na inicialização e falha cedo para configurações inválidas.
// Falhar aqui impede o boot com segredo fraco ou ausente (Princípio V da Constituição).
import { z } from 'zod';

const SECRET_MIN_LENGTH = 32;

export const envSchema = z
  .object({
    // --- Servidor ---
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),

    // --- Banco ---
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),

    // --- Autenticação (JWT + CSRF) ---
    JWT_SECRET: z
      .string()
      .min(SECRET_MIN_LENGTH, `JWT_SECRET deve ter ao menos ${SECRET_MIN_LENGTH} caracteres.`),
    JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    CSRF_SECRET: z
      .string()
      .min(SECRET_MIN_LENGTH, `CSRF_SECRET deve ter ao menos ${SECRET_MIN_LENGTH} caracteres.`),
    // Ausente = derivado de NODE_ENV (Secure ligado em production).
    // Explícito vence — o Compose local usa `false` porque serve http://localhost.
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),

    // --- CORS (origens explícitas, nunca '*') ---
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    // --- Rate limiting: limites configuráveis por ambiente ---
    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(20),
    SCAN_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),

    // --- Upload de CRLV ---
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),

    // --- Gemini (opcional: sem chave a API sobe e o import responde 502) ---
    GOOGLE_API_KEY: z.string().optional().default(''),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  })
  .superRefine((env, ctx) => {
    if (env.CSRF_SECRET === env.JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['CSRF_SECRET'],
        message: 'CSRF_SECRET deve ser diferente de JWT_SECRET.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Valida `process.env` + `.env` e devolve o ambiente tipado, ou derruba o boot. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join(' | ');
    throw new Error(`Configuração de ambiente inválida — ${problems}`);
  }

  return result.data;
}
