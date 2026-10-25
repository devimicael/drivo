const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export function validateCrlvFile(file: Pick<File, "name" | "type" | "size">): string | null {
  if (file.size > MAX_BYTES) return "O arquivo deve ter até 5 MB.";
  if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name) || !TYPES.has(file.type)) {
    return "Escolha um arquivo PDF, JPG, PNG ou WebP.";
  }
  return null;
}
