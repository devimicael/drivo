/** P2002 = violação de restrição única no Prisma (ex.: e-mail ou placa duplicados). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}
