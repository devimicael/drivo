import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, rm } from 'node:fs/promises';
import { sanitizeCrlvExtraction } from './schemas/crlv-extraction.schema.js';
import { GeminiClient, GeminiFailure } from './gemini/gemini.client.js';
import { validateCrlvFile } from './file.validator.js';

const required = ['placa', 'marca', 'modelo', 'ano', 'chassi'] as const;
@Injectable()
export class CrlvService {
  constructor(private readonly gemini: GeminiClient, private readonly config: ConfigService) {}

  async scan(file: Express.Multer.File) {
    try {
      file.buffer = file.buffer ?? await readFile(file.path);
      validateCrlvFile(file, this.config.getOrThrow<number>('UPLOAD_MAX_BYTES'));
      let raw: unknown;
      try {
        raw = await this.gemini.extract(file.buffer, file.mimetype);
      } catch (error) {
        const code = error instanceof GeminiFailure ? error.code : 'GEMINI_UNAVAILABLE';
        throw new BadGatewayException({ code, message: 'Falha na leitura automática. Preencha manualmente.' });
      }
      const extracted = sanitizeCrlvExtraction(raw);
      return { data: { extracted, missingRequiredFields: required.filter((field) => extracted[field] === undefined), source: 'GEMINI' as const } };
    } finally {
      if (file.path) await rm(file.path, { force: true });
    }
  }
}
