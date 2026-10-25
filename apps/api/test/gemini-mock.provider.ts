import { jest } from '@jest/globals';
import {
  GeminiClient,
  GeminiFailure,
} from '../src/modules/crlv/gemini/gemini.client.js';

export const geminiFailureCodes = [
  'GEMINI_TIMEOUT',
  'GEMINI_UNAVAILABLE',
  'GEMINI_QUOTA_EXCEEDED',
  'GEMINI_INVALID_RESPONSE',
] as const;

/** Double exclusivo dos testes: nunca usa chave, rede ou cota do provedor. */
export function createGeminiMock() {
  const extract = jest.fn<GeminiClient['extract']>();
  return {
    extract,
    failNext(code: (typeof geminiFailureCodes)[number]) {
      extract.mockRejectedValueOnce(new GeminiFailure(code));
    },
  };
}
