import { BadRequestException } from '@nestjs/common';

const types = {
  '.pdf': { mime: 'application/pdf', signature: (b: Buffer) => b.subarray(0, 4).toString() === '%PDF' },
  '.jpg': { mime: 'image/jpeg', signature: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.jpeg': { mime: 'image/jpeg', signature: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.png': { mime: 'image/png', signature: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  '.webp': { mime: 'image/webp', signature: (b: Buffer) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
} as const;
export const MAX_CRVL_BYTES = 5_242_880;

export function validateCrlvFile(file: Express.Multer.File, maxBytes = MAX_CRVL_BYTES): void {
  if (file.size > maxBytes) throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'O arquivo deve ter até 5 MB.' });
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] as keyof typeof types | undefined;
  const expected = ext ? types[ext] : undefined;
  if (!expected) throw new BadRequestException({ code: 'UNSUPPORTED_FILE_TYPE', message: 'Formato de arquivo não permitido.' });
  if (file.mimetype !== expected.mime) throw new BadRequestException({ code: 'UNSUPPORTED_FILE_TYPE', message: 'Formato de arquivo não permitido.' });
  if (!expected.signature(file.buffer)) throw new BadRequestException({ code: 'FILE_CONTENT_MISMATCH', message: 'O conteúdo não corresponde ao formato do arquivo.' });
}
