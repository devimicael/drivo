import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';

const generateContent =
  jest.fn<(...args: unknown[]) => Promise<{ text?: string }>>();
const googleGenAI = jest.fn().mockImplementation(function () {
  return { models: { generateContent } };
});
jest.unstable_mockModule('@google/genai', () => ({ GoogleGenAI: googleGenAI }));
const { GeminiClient, GeminiFailure } = await import('./gemini.client.js');

function client(key = 'unit-only-key') {
  return new GeminiClient(
    new ConfigService({
      GOOGLE_API_KEY: key,
      GEMINI_MODEL: 'test-model',
      GEMINI_TIMEOUT_MS: 1000,
    }),
  );
}

describe('GeminiClient', () => {
  beforeEach(() => {
    googleGenAI.mockClear();
    generateContent.mockReset();
  });

  it('uses the JSON-compatible API version and sends the configured model', async () => {
    generateContent.mockResolvedValue({ text: '{"placa":"DQA1A23"}' });
    await expect(
      client().extract(Buffer.from('fixture'), 'application/pdf'),
    ).resolves.toEqual({ placa: 'DQA1A23' });
    expect(googleGenAI).toHaveBeenCalledWith({
      apiKey: 'unit-only-key',
      httpOptions: { apiVersion: 'v1beta' },
    });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
        }),
      }),
    );
  });

  it('does not call the provider when the key is absent', async () => {
    await expect(
      client('').extract(Buffer.from('fixture'), 'application/pdf'),
    ).rejects.toMatchObject({ code: 'GEMINI_UNAVAILABLE' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'not JSON'])(
    'rejects malformed or empty provider output (%s)',
    async (text) => {
      generateContent.mockResolvedValue(text === undefined ? {} : { text });
      await expect(
        client().extract(Buffer.from('fixture'), 'application/pdf'),
      ).rejects.toEqual(new GeminiFailure('GEMINI_INVALID_RESPONSE'));
    },
  );

  it.each([
    ['Operation aborted', 'GEMINI_TIMEOUT'],
    ['429 quota exceeded', 'GEMINI_QUOTA_EXCEEDED'],
    ['Service unavailable', 'GEMINI_UNAVAILABLE'],
  ])(
    'maps provider failure %s without leaking its message',
    async (message, code) => {
      generateContent.mockRejectedValue(new Error(message));
      await expect(
        client().extract(Buffer.from('fixture'), 'application/pdf'),
      ).rejects.toEqual(new GeminiFailure(code));
    },
  );
});
