import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { crlvJsonSchema } from './crlv-json-schema.js';

export type GeminiFailureCode =
  | 'GEMINI_TIMEOUT'
  | 'GEMINI_UNAVAILABLE'
  | 'GEMINI_QUOTA_EXCEEDED'
  | 'GEMINI_INVALID_RESPONSE';

export class GeminiFailure extends Error {
  constructor(readonly code: GeminiFailureCode) {
    super(code);
  }
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  constructor(private readonly config: ConfigService) {}

  async extract(buffer: Buffer, mimeType: string): Promise<unknown> {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    if (!apiKey) throw new GeminiFailure('GEMINI_UNAVAILABLE');
    // JSON mode do Gemini Developer API exige v1beta (v1 retorna HTTP 400).
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1beta' },
    });
    try {
      const response = await ai.models.generateContent({
        model: this.config.getOrThrow<string>('GEMINI_MODEL'),
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Extraia somente dados que estejam claramente visíveis neste CRLV. Não infira nem invente valores. Responda no formato JSON solicitado.',
              },
              { inlineData: { mimeType, data: buffer.toString('base64') } },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: crlvJsonSchema,
          abortSignal: AbortSignal.timeout(
            this.config.getOrThrow<number>('GEMINI_TIMEOUT_MS'),
          ),
        },
      });
      const text = response.text;
      if (!text) throw new GeminiFailure('GEMINI_INVALID_RESPONSE');
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new GeminiFailure('GEMINI_INVALID_RESPONSE');
      }
    } catch (error) {
      if (error instanceof GeminiFailure) throw error;
      this.logger.warn('Falha na chamada ao serviço de leitura do CRLV.');
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const code =
        message.includes('abort') || message.includes('timeout')
          ? 'GEMINI_TIMEOUT'
          : message.includes('429') || message.includes('quota')
            ? 'GEMINI_QUOTA_EXCEEDED'
            : 'GEMINI_UNAVAILABLE';
      throw new GeminiFailure(code);
    }
  }
}
